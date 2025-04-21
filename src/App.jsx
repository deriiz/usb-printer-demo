import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState('');
  const [availablePrinters, setAvailablePrinters] = useState([]);

  // Known printer configurations - expanded
  const PRINTERS = {
    BEEPRT: {
      name: "Beeprt LabelPrinter",
      vendorId: 0x09C6,
      productId: 0x0426
    },
    ZEBRA: {
      name: "Zebra ZTC ZD230",
      vendorId: 0x0A5F,
      productId: 0x0166
    },
    ZEBRA_ALT: { // Additional Zebra model
      name: "Zebra GK420d",
      vendorId: 0x0A5F,
      productId: 0x008C
    },
    GENERIC: { // For testing any printer
      name: "Generic Printer",
      vendorId: null,
      productId: null
    }
  };

  // Helper to determine if we're on a mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Get OS type for specific instructions
  const getOSType = () => {
    if (navigator.userAgent.indexOf("Win") !== -1) return "Windows";
    if (navigator.userAgent.indexOf("Mac") !== -1) return "MacOS";
    if (navigator.userAgent.indexOf("Linux") !== -1) return "Linux";
    if (navigator.userAgent.indexOf("Android") !== -1) return "Android";
    if (navigator.userAgent.indexOf("iPhone") !== -1 || navigator.userAgent.indexOf("iPad") !== -1) return "iOS";
    return "Unknown";
  };

  const detectPrinters = async () => {
    try {
      // Check if WebUSB is supported
      if (!navigator.usb) {
        setLastError("WebUSB tidak didukung di browser ini. Gunakan Chrome terbaru.");
        return [];
      }
      
      const devices = await navigator.usb.getDevices();
      console.log("Detected USB devices:", devices.length);
      
      // Log all devices for debugging
      devices.forEach(device => {
        console.log(`Device: ${device.productName || 'Unknown'}, VendorID: 0x${device.vendorId.toString(16)}, ProductID: 0x${device.productId.toString(16)}`);
      });
      
      // Filter known printers and also include generic devices that might be printers
      const printers = devices.filter(device => 
        (device.vendorId === PRINTERS.BEEPRT.vendorId && device.productId === PRINTERS.BEEPRT.productId) ||
        (device.vendorId === PRINTERS.ZEBRA.vendorId && device.productId === PRINTERS.ZEBRA.productId) ||
        (device.vendorId === PRINTERS.ZEBRA_ALT.vendorId && device.productId === PRINTERS.ZEBRA_ALT.productId) ||
        // Include devices with printer-like interface classes (7 is the printer class)
        (device.configuration && device.configuration.interfaces.some(iface => 
          iface.alternate && iface.alternate.interfaceClass === 7))
      );
      
      return printers;
    } catch (error) {
      console.error("Error detecting printers:", error);
      setLastError(`Deteksi printer gagal: ${error.message}`);
      return [];
    }
  };

  const findOutEndpoint = (device) => {
    if (!device.configuration) return null;
    
    // First look for printer class interfaces (7)
    for (const iface of device.configuration.interfaces) {
      const alternate = iface.alternate;
      if (alternate.interfaceClass === 7) { // Printer class
        const endpoint = alternate.endpoints.find(ep => ep.direction === 'out');
        if (endpoint) {
          return { interfaceNumber: iface.interfaceNumber, endpointNumber: endpoint.endpointNumber };
        }
      }
    }
    
    // If no printer interfaces, look for any OUT endpoint
    for (const iface of device.configuration.interfaces) {
      const alternate = iface.alternate;
      const endpoint = alternate.endpoints.find(ep => ep.direction === 'out');
      if (endpoint) {
        return { interfaceNumber: iface.interfaceNumber, endpointNumber: endpoint.endpointNumber };
      }
    }
    
    return null;
  };

  const resetDevice = async (device) => {
    // For devices that might be in a bad state
    try {
      if (device.opened) {
        await device.close();
      }
      await device.open();
      await device.reset();
      await device.close();
      return true;
    } catch (error) {
      console.error("Error resetting device:", error);
      return false;
    }
  };

  const sendToPrinter = async (device, zpl) => {
    let retryCount = 0;
    const maxRetries = 5; // Menambah jumlah retry untuk HP
    
    while (retryCount < maxRetries) {
      let deviceWasReopened = false;
      
      try {
        // Make sure device is closed first to avoid locked states
        if (device.opened) {
          await device.close();
        }
        
        // Tunggu sebentar sebelum membuka koneksi
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await device.open();
        
        if (device.configuration === null) {
          await device.selectConfiguration(1);
        }
        
        const endpointInfo = findOutEndpoint(device);
        if (!endpointInfo) {
          throw new Error('Tidak ditemukan endpoint OUT pada perangkat ini');
        }

        // Mobile devices often have issues with claimInterface
        try {
          await device.claimInterface(endpointInfo.interfaceNumber);
        } catch (claimError) {
          console.warn("Gagal claim interface, mencoba alternatif:", claimError);
          
          // Try resetting the device and reopening
          if (isMobileDevice()) {
            await device.close();
            await new Promise(resolve => setTimeout(resolve, 800)); // Tambah delay untuk HP
            
            // Try reopening with a different approach for mobile
            await device.open();
            if (device.configuration === null) {
              await device.selectConfiguration(1);
            }
            
            // Some mobile browsers require releasing other interfaces first
            for (const iface of device.configuration.interfaces) {
              try {
                await device.releaseInterface(iface.interfaceNumber);
              } catch (e) {
                // Ignore errors here, might not be claimed
              }
            }
            
            // Tunggu sebentar lagi untuk HP
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Now try claiming our interface again
            await device.claimInterface(endpointInfo.interfaceNumber);
            deviceWasReopened = true;
          } else {
            throw claimError; // Re-throw if not mobile or if our fix didn't work
          }
        }
        
        // For Zebra printers, the format might need to be different
        const isPrinterZebra = device.vendorId === PRINTERS.ZEBRA.vendorId || 
                              device.vendorId === PRINTERS.ZEBRA_ALT.vendorId;
        
        let printData;
        if (isPrinterZebra) {
          // Zebra printers might need different formatting or commands
          printData = zpl;
        } else {
          // Beeprt/Kassen might need different commands
          printData = zpl;
        }
        
        const encoder = new TextEncoder();
        const data = encoder.encode(printData);
        
        // Add debugging info before transfer
        console.log(`Attempting to send ${data.length} bytes to endpoint ${endpointInfo.endpointNumber}`);
        
        // Different strategies for different device types
        let result;
        
        // For Windows laptops
        if (getOSType() === "Windows" && !isMobileDevice()) {
          // Try sending in even smaller chunks with longer delays
          const chunkSize = 256;
          const chunkDelay = 300; // ms
          
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            console.log(`Sending chunk ${Math.floor(i/chunkSize) + 1} of ${Math.ceil(data.length/chunkSize)}`);
            result = await device.transferOut(endpointInfo.endpointNumber, chunk);
            
            if (result.status !== 'ok') {
              throw new Error(`Transfer gagal pada chunk ${Math.floor(i/chunkSize) + 1}: ${result.status}`);
            }
            
            // Longer delay between chunks for Windows
            await new Promise(resolve => setTimeout(resolve, chunkDelay));
          }
        }
        // For Android mobile devices
        else if (getOSType() === "Android" && isMobileDevice()) {
          // Use much smaller chunks on Android phones (128 bytes)
          const chunkSize = 128;
          // Add much longer delays between chunks
          const chunkDelay = 400; // ms
          
          // Tambahkan initialization sequence untuk printer
          if (isPrinterZebra) {
            // Reset command untuk Zebra
            const initCmd = new Uint8Array([0x1B, 0x40]); // ESC @ command (reset)
            await device.transferOut(endpointInfo.endpointNumber, initCmd);
            await new Promise(resolve => setTimeout(resolve, 500)); // Tunggu setelah reset
          }
          
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            console.log(`Sending chunk ${Math.floor(i/chunkSize) + 1} of ${Math.ceil(data.length/chunkSize)}`);
            
            // Coba kirim chunk dengan retry internal
            let chunkRetry = 0;
            let chunkSuccess = false;
            
            while (chunkRetry < 3 && !chunkSuccess) {
              try {
                result = await device.transferOut(endpointInfo.endpointNumber, chunk);
                
                if (result.status === 'ok') {
                  chunkSuccess = true;
                } else {
                  throw new Error(`Chunk status: ${result.status}`);
                }
              } catch (chunkError) {
                chunkRetry++;
                console.warn(`Gagal kirim chunk, retry ${chunkRetry}/3: ${chunkError.message}`);
                await new Promise(resolve => setTimeout(resolve, 200)); // Tunggu sebelum retry
              }
            }
            
            if (!chunkSuccess) {
              throw new Error(`Transfer gagal pada chunk ${Math.floor(i/chunkSize) + 1} setelah 3x retry`);
            }
            
            // Longer delay between chunks for Android
            await new Promise(resolve => setTimeout(resolve, chunkDelay));
            
            // Setiap 5 chunk, tambah delay lebih lama untuk let printer catch up
            if ((Math.floor(i/chunkSize) + 1) % 5 === 0) {
              await new Promise(resolve => setTimeout(resolve, 800));
            }
          }
          
          // Final delay to ensure all data is processed
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // For other mobile devices (iOS, etc)
        else if (isMobileDevice()) {
          // Use even smaller chunks on mobile (256 bytes)
          const chunkSize = 256;
          // Add longer delays between chunks
          const chunkDelay = 300; // ms
          
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            console.log(`Sending chunk ${Math.floor(i/chunkSize) + 1} of ${Math.ceil(data.length/chunkSize)}`);
            result = await device.transferOut(endpointInfo.endpointNumber, chunk);
            
            if (result.status !== 'ok') {
              throw new Error(`Transfer gagal pada chunk ${Math.floor(i/chunkSize) + 1}: ${result.status}`);
            }
            
            // Delay between chunks for mobile
            await new Promise(resolve => setTimeout(resolve, chunkDelay));
          }
        } 
        // For other devices (tablets, etc.)
        else {
          // Try sending in medium chunks
          const chunkSize = 1024;
          
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            result = await device.transferOut(endpointInfo.endpointNumber, chunk);
            
            if (result.status !== 'ok') {
              throw new Error(`Transfer gagal pada chunk ${Math.floor(i/chunkSize) + 1}: ${result.status}`);
            }
            
            // Small delay
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        return true;
      } catch (error) {
        retryCount++;
        console.error(`Attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          throw error;
        }
        
        // Wait longer before retry on Android
        const retryDelay = isMobileDevice() && getOSType() === "Android" ? 2000 : 1000;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Reset device more aggressively on Android
        if (isMobileDevice() && getOSType() === "Android") {
          console.log("Melakukan reset perangkat HP Android...");
          await resetDevice(device);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          await resetDevice(device);
        }
      } finally {
        try {
          // Ensure we release the interface before closing
          if (device.opened) {
            const endpointInfo = findOutEndpoint(device);
            if (endpointInfo) {
              try {
                await device.releaseInterface(endpointInfo.interfaceNumber);
              } catch (e) {
                console.warn("Gagal release interface:", e);
              }
            }
            await device.close();
          }
        } catch (err) {
          console.error("Error closing device:", err);
        }
      }
    }
    
    throw new Error("Gagal setelah mencoba beberapa kali");
  };

  const getPrinterTypeString = (device) => {
    if (device.vendorId === PRINTERS.BEEPRT.vendorId) return "Beeprt/Kassen";
    if (device.vendorId === PRINTERS.ZEBRA.vendorId || device.vendorId === PRINTERS.ZEBRA_ALT.vendorId) return "Zebra";
    
    // Try to get product name
    return device.productName || "Printer Umum";
  };

  const handlePrint = async () => {
    setIsLoading(true);
    setLastError('');
    
    try {
      // First check if we already have permissions to any printers
      const existingDevices = await detectPrinters();
      
      let deviceToPrint;
      
      if (existingDevices.length === 0) {
        // No printers with permissions, request access
        try {
          // Try with empty filters first to see all devices
          let filters = [];
          
          // If on desktop, add known printer filters
          if (!isMobileDevice()) {
            filters = [
              { vendorId: PRINTERS.BEEPRT.vendorId },
              { vendorId: PRINTERS.ZEBRA.vendorId },
              { vendorId: PRINTERS.ZEBRA_ALT.vendorId }
            ];
          }
          
          const device = await navigator.usb.requestDevice({ filters });
          deviceToPrint = device;
          
          // Cek apakah printer butuh driver dan tampilkan informasi
          if (isPrinterNeedsDriver(device)) {
            showDriverInstallHelp(device);
          }
        } catch (requestError) {
          if (requestError.name === 'NotFoundError') {
            throw new Error('Tidak ada printer yang dipilih. Silakan pilih printer pada dialog.');
          } else {
            throw requestError;
          }
        }
      } else if (existingDevices.length === 1) {
        // Only one printer available, use it directly
        deviceToPrint = existingDevices[0];
      } else {
        // Multiple printers available, let user choose
        const result = await Swal.fire({
          title: 'Pilih Printer',
          input: 'select',
          inputOptions: existingDevices.reduce((acc, device, index) => {
            acc[index] = `${getPrinterTypeString(device)} (${device.serialNumber || 'No Serial'})`;
            return acc;
          }, {}),
          inputPlaceholder: 'Pilih printer',
          showCancelButton: true,
          inputValidator: (value) => {
            return new Promise((resolve) => {
              if (value !== '') {
                resolve();
              } else {
                resolve('Anda harus memilih printer');
              }
            });
          }
        });
        
        if (result.isConfirmed) {
          deviceToPrint = existingDevices[result.value];
        } else {
          return; // User cancelled
        }
      }
      
      // Deteksi apakah di HP Android
      const isAndroidPhone = getOSType() === "Android" && isMobileDevice();
      
      // Sample ZPL code for test print
      const zpl = `^XA^FO50,50^ADN,36,20^FDTest Print via USB^FS^XZ`;
      
      // Display loading notification on mobile
      let loadingNotification;
      if (isMobileDevice()) {
        loadingNotification = Swal.fire({
          title: 'Mengirim ke printer...',
          text: isAndroidPhone ? 'Mohon tunggu, ini bisa memakan waktu lebih lama di HP Android' : 'Mohon tunggu',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
      }
      
      // Send to printer
      const success = await sendToPrinter(deviceToPrint, zpl);
      
      // Close loading notification if it exists
      if (loadingNotification) {
        loadingNotification.close();
      }
      
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Mencetak',
          text: `Label dikirim ke printer ${getPrinterTypeString(deviceToPrint)}.`,
          timer: 2000,
          showConfirmButton: false
        });
        
        // Refresh the available printers list
        const updatedPrinters = await detectPrinters();
        setAvailablePrinters(updatedPrinters);
      }
    } catch (error) {
      console.error("Printing error:", error);
      setLastError(`${error.message || 'Terjadi kesalahan tidak diketahui'}`);
      
      // Tampilkan pesan error yang lebih informatif untuk HP Android
      if (getOSType() === "Android" && isMobileDevice()) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mencetak',
          html: `
            <p>Error: ${error.message || 'Terjadi kesalahan tidak diketahui'}</p>
            <div style="text-align:left; margin-top:15px;">
              <p><strong>Tips untuk HP Android:</strong></p>
              <ul>
                <li>Pastikan kabel OTG terpasang dengan baik</li>
                <li>Coba cabut dan colok kembali printer</li>
                <li>Pastikan printer dalam keadaan menyala</li>
                <li>Izinkan akses USB saat diminta</li>
                <li>Gunakan browser Chrome terbaru</li>
              </ul>
            </div>
          `,
          confirmButtonColor: '#d33',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mencetak',
          text: `Error: ${error.message || 'Terjadi kesalahan tidak diketahui'}`,
          confirmButtonColor: '#d33',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkCompatibility = () => {
      if (!navigator.usb) {
        setLastError("WebUSB tidak didukung di browser ini. Gunakan Google Chrome versi terbaru");
        return;
      }
    };

    // Check browser compatibility
    checkCompatibility();

    // Initial printer detection
    const checkAvailablePrinters = async () => {
      const printers = await detectPrinters();
      setAvailablePrinters(printers);
    };

    checkAvailablePrinters();

    // Add listeners for when printers are connected/disconnected
    if (navigator.usb) {
      navigator.usb.addEventListener('connect', checkAvailablePrinters);
      navigator.usb.addEventListener('disconnect', checkAvailablePrinters);

      // Clean up listeners
      return () => {
        navigator.usb.removeEventListener('connect', checkAvailablePrinters);
        navigator.usb.removeEventListener('disconnect', checkAvailablePrinters);
      };
    }
  }, []);

  // Helper untuk mendeteksi apakah printer butuh driver tambahan
  const isPrinterNeedsDriver = (device) => {
    // Periksa jenis printer berdasarkan IDs
    if (device.vendorId === PRINTERS.ZEBRA.vendorId || 
        device.vendorId === PRINTERS.ZEBRA_ALT.vendorId) {
      return true; // Zebra printer biasanya butuh driver asli
    }
    return false;
  };

  // Fungsi untuk tampilkan bantuan instalasi driver jika dibutuhkan
  const showDriverInstallHelp = (device) => {
    let driverMessage = '';
    
    if (device.vendorId === PRINTERS.ZEBRA.vendorId || 
        device.vendorId === PRINTERS.ZEBRA_ALT.vendorId) {
      driverMessage = `
        <p>Printer Zebra terdeteksi. Untuk penggunaan optimal:</p>
        <ul>
          <li>Windows: Install <a href="https://www.zebra.com/us/en/support-downloads/printer-software/printer-drivers.html" target="_blank">Zebra Driver</a></li>
          <li>Android: Download aplikasi Zebra Utilities dari Play Store</li>
        </ul>
      `;
    } else if (device.vendorId === PRINTERS.BEEPRT.vendorId) {
      driverMessage = `
        <p>Printer Beeprt/Kassen terdeteksi:</p>
        <ul>
          <li>Windows: Install driver dari CD atau website resmi</li>
          <li>Android: Pastikan kabel OTG dan printer dalam kondisi baik</li>
        </ul>
      `;
    }
    
    if (driverMessage) {
      Swal.fire({
        title: 'Informasi Driver Printer',
        html: driverMessage,
        icon: 'info',
        confirmButtonText: 'Mengerti'
      });
    }
  };

  return (
    <div className="container">
      <h1>USB Printer Demo</h1>
      
      <div style={{ position: 'relative' }}>
        <button
          className="print-button"
          onClick={handlePrint}
          disabled={isLoading || !navigator.usb}
          style={{
            backgroundColor: '#3085d6',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            border: 'none',
            borderRadius: '5px',
            cursor: (isLoading || !navigator.usb) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || !navigator.usb) ? 0.7 : 1,
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
            display: 'block',
            margin: '20px auto'
          }}
        >
          {isLoading ? 'Sedang Mencetak...' : 'Print via USB'}
        </button>
        
        <button
          onClick={() => {
            Swal.fire({
              title: 'Bantuan Printing',
              html: `
                <div style="text-align:left;">
                  <p><strong>Tips untuk berbagai perangkat:</strong></p>
                  <p><u>HP Android:</u></p>
                  <ul>
                    <li>Gunakan browser Chrome terbaru</li>
                    <li>Pastikan kabel OTG terpasang dengan benar</li>
                    <li>Izinkan akses USB saat diminta</li>
                    <li>Proses print mungkin lebih lambat, harap bersabar</li>
                  </ul>
                  <p><u>Laptop/PC:</u></p>
                  <ul>
                    <li>Install driver printer yang sesuai</li>
                    <li>Gunakan browser Chrome terbaru</li>
                    <li>Untuk printer Zebra: <a href="https://www.zebra.com/us/en/support-downloads/printer-software/printer-drivers.html" target="_blank">Download driver di sini</a></li>
                  </ul>
                  <p><u>Tablet:</u></p>
                  <ul>
                    <li>Gunakan browser Chrome terbaru</li>
                    <li>Pastikan tablet mendukung USB OTG</li>
                  </ul>
                </div>
              `,
              icon: 'info',
              confirmButtonText: 'Mengerti'
            });
          }}
          style={{
            position: 'absolute',
            right: '0',
            top: '20px',
            backgroundColor: '#6c757d',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ?
        </button>
      </div>
      
      {lastError && (
        <div className="error-message" style={{ 
          marginTop: '15px', 
          color: 'red',
          fontSize: '14px',
          padding: '10px',
          backgroundColor: '#ffecec',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <strong>Info/Error:</strong> {lastError}
        </div>
      )}
      
      {!navigator.usb && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '5px',
          textAlign: 'center',
          color: '#856404'
        }}>
          <strong>Browser tidak kompatibel!</strong> Untuk menggunakan fitur USB printing, silakan gunakan browser Google Chrome versi terbaru.
        </div>
      )}
    </div>
  );
}

export default App;