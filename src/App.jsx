// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// // export default App



// function App() {
//   const handlePrint = async () => {
//     try {
//       // Buka dialog pilih device USB (tanpa filter)
//       const device = await navigator.usb.requestDevice({ filters: [] });

//       // Buka dan klaim device
//       await device.open();
//       if (device.configuration === null) {
//         await device.selectConfiguration(1);
//       }
//       await device.claimInterface(0);

//       // Kirim ZPL
//       const zpl = `^XA^FO50,50^ADN,36,20^FDTest Print via USB^FS^XZ`;
//       const encoder = new TextEncoder();
//       const data = encoder.encode(zpl);

//       await device.transferOut(1, data);
//       alert("✅ Label berhasil dikirim ke printer via USB!");
//     } catch (error) {
//       console.error(error);
//       alert("❌ Gagal mengirim ke printer. Cek koneksi & izin USB.");
//     }
//   };

//   return (
//     <div style={{ padding: 40 }}>
//       <h1>USB Label Print Demo</h1>
//       <button onClick={handlePrint} style={{ fontSize: 20, padding: 10 }}>
//         Print ZPL via USB
//       </button>
//     </div>
//   );
// }

// export default App;


//TEST KODE FOR PRINTER ZEBRA
// import Swal from 'sweetalert2';
// import './App.css';

// function App() {
//   const handlePrint = async () => {
//     try {
//       const device = await navigator.usb.requestDevice({ filters: [] });

//       await device.open();
//       if (device.configuration === null) {
//         await device.selectConfiguration(1);
//       }
//       await device.claimInterface(0);

//       const zpl = `^XA^FO50,50^ADN,36,20^FDTest Print via USB^FS^XZ`;
//       const encoder = new TextEncoder();
//       const data = encoder.encode(zpl);

//       await device.transferOut(1, data);

//       Swal.fire({
//         icon: 'success',
//         title: 'Success',
//         text: 'Label has been successfully sent to the USB printer.',
//         timer: 2000,
//         showConfirmButton: false
//       });
//       } catch (error) {
//         console.error(error);
//         Swal.fire({
//           icon: 'error',
//           title: 'Failed',
//           text: 'Failed to send to printer. Check USB connection & permissions.',
//           confirmButtonColor: '#d33',
//         });
//     }
//   };

//   return (
//     <div className="container">
//       <h1>USB Label Print Demo</h1>
//       <button className="print-button" onClick={handlePrint} style={{ backgroundColor: '#3085d6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
//         Print via USB
//       </button>
//     </div>
//   );
// }

// export default App;


//TEST KODE FOR PRINTER KASSEN
// import Swal from 'sweetalert2';
// import './App.css';

// function App() {
//   const handlePrint = async () => {
//     try {
//       const device = await navigator.usb.requestDevice({
//         filters: [{ vendorId: 0x09C6 }] // Beeprt, Kassen, Zebra clone
//       });

//       await device.open();

//       if (device.configuration === null) {
//         await device.selectConfiguration(1);
//       }

//       // Temukan interface dengan endpoint OUT
//       const outInterface = device.configuration.interfaces.find(iface =>
//         iface.alternate.endpoints.some(ep => ep.direction === 'out')
//       );

//       if (!outInterface) {
//         throw new Error('Tidak ada interface dengan endpoint OUT ditemukan.');
//       }

//       const interfaceNumber = outInterface.interfaceNumber;
//       await device.claimInterface(interfaceNumber);

//       const endpointOut = outInterface.alternate.endpoints.find(ep => ep.direction === 'out');

//       if (!endpointOut) {
//         throw new Error('Tidak menemukan endpoint OUT.');
//       }

//       const zpl = `^XA^FO50,50^ADN,36,20^FDTest Print via USB^FS^XZ`;
//       const encoder = new TextEncoder();
//       const data = encoder.encode(zpl);

//       const result = await device.transferOut(endpointOut.endpointNumber, data);

//       if (result.status === 'ok') {
//         Swal.fire({
//           icon: 'success',
//           title: 'Success',
//           text: 'Label has been successfully sent to the USB printer.',
//           timer: 2000,
//           showConfirmButton: false
//         });
//       } else {
//         throw new Error(`Transfer failed. Status: ${result.status}`);
//       }

//     } catch (error) {
//       console.error(error);
//       Swal.fire({
//         icon: 'error',
//         title: 'Failed',
//         text: 'Failed to send to printer. Check USB connection & permissions.',
//         confirmButtonColor: '#d33',
//       });
//     }
//   };

//   return (
//     <div className="container">
//       <h1>USB Label Print Demo</h1>
//       <button
//         className="print-button"
//         onClick={handlePrint}
//         style={{
//           backgroundColor: '#3085d6',
//           color: 'white',
//           padding: '10px 20px',
//           border: 'none',
//           borderRadius: '5px',
//           cursor: 'pointer'
//         }}
//       >
//         Print via USB
//       </button>
//     </div>
//   );
// }

// export default App;

//TEST KODE ZEBRA & KASSEN
// import { useState, useEffect } from 'react';
// import Swal from 'sweetalert2';
// import './App.css';

// function App() {
//   const [availablePrinters, setAvailablePrinters] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);

//   // Known printer configurations
//   const PRINTERS = {
//     BEEPRT: {
//       name: "Beeprt LabelPrinter",
//       vendorId: 0x09C6,
//       productId: 0x0426
//     },
//     ZEBRA: {
//       name: "Zebra ZTC ZD230",
//       vendorId: 0x0A5F,
//       productId: 0x0166
//     }
//   };

//   const detectPrinters = async () => {
//     try {
//       const devices = await navigator.usb.getDevices();
      
//       const printers = devices.filter(device => 
//         (device.vendorId === PRINTERS.BEEPRT.vendorId && device.productId === PRINTERS.BEEPRT.productId) ||
//         (device.vendorId === PRINTERS.ZEBRA.vendorId && device.productId === PRINTERS.ZEBRA.productId)
//       );
      
//       return printers;
//     } catch (error) {
//       console.error("Error detecting printers:", error);
//       return [];
//     }
//   };

//   const findOutEndpoint = (device) => {
//     if (!device.configuration) return null;
    
//     for (const iface of device.configuration.interfaces) {
//       const alternate = iface.alternate;
//       const endpoint = alternate.endpoints.find(ep => ep.direction === 'out');
//       if (endpoint) {
//         return { interfaceNumber: iface.interfaceNumber, endpointNumber: endpoint.endpointNumber };
//       }
//     }
//     return null;
//   };

//   const sendToPrinter = async (device, zpl) => {
//     try {
//       await device.open();
      
//       if (device.configuration === null) {
//         await device.selectConfiguration(1);
//       }
      
//       const endpointInfo = findOutEndpoint(device);
//       if (!endpointInfo) {
//         throw new Error('No OUT endpoint found on this device');
//       }
      
//       await device.claimInterface(endpointInfo.interfaceNumber);
      
//       // For Zebra printers, the format might need to be different
//       const isPrinterZebra = device.vendorId === PRINTERS.ZEBRA.vendorId;
//       const printData = isPrinterZebra 
//         ? zpl
//         : zpl; // Same for now, but you could customize per printer if needed
      
//       const encoder = new TextEncoder();
//       const data = encoder.encode(printData);
      
//       const result = await device.transferOut(endpointInfo.endpointNumber, data);
      
//       if (result.status === 'ok') {
//         return true;
//       } else {
//         throw new Error(`Transfer failed with status: ${result.status}`);
//       }
//     } finally {
//       try {
//         // Close the device connection
//         if (device.opened) {
//           await device.close();
//         }
//       } catch (err) {
//         console.error("Error closing device:", err);
//       }
//     }
//   };

//   const getPrinterTypeString = (device) => {
//     if (device.vendorId === PRINTERS.BEEPRT.vendorId) {
//       return "Beeprt/Kassen";
//     } else if (device.vendorId === PRINTERS.ZEBRA.vendorId) {
//       return "Zebra";
//     } else {
//       return `Unknown (${device.vendorId.toString(16)}:${device.productId.toString(16)})`;
//     }
//   };

//   const handlePrint = async () => {
//     setIsLoading(true);
//     try {
//       // First check if we already have permissions to any printers
//       const existingDevices = await detectPrinters();
      
//       let deviceToPrint;
      
//       if (existingDevices.length === 0) {
//         // No printers with permissions, request access
//         const device = await navigator.usb.requestDevice({
//           filters: [
//             { vendorId: PRINTERS.BEEPRT.vendorId },
//             { vendorId: PRINTERS.ZEBRA.vendorId }
//           ]
//         });
//         deviceToPrint = device;
//       } else if (existingDevices.length === 1) {
//         // Only one printer available, use it directly
//         deviceToPrint = existingDevices[0];
//       } else {
//         // Multiple printers available, let user choose
//         const result = await Swal.fire({
//           title: 'Select Printer',
//           input: 'select',
//           inputOptions: existingDevices.reduce((acc, device, index) => {
//             acc[index] = `${getPrinterTypeString(device)} (${device.serialNumber || 'No Serial'})`;
//             return acc;
//           }, {}),
//           inputPlaceholder: 'Select a printer',
//           showCancelButton: true,
//           inputValidator: (value) => {
//             return new Promise((resolve) => {
//               if (value !== '') {
//                 resolve();
//               } else {
//                 resolve('You need to select a printer');
//               }
//             });
//           }
//         });
        
//         if (result.isConfirmed) {
//           deviceToPrint = existingDevices[result.value];
//         } else {
//           return; // User cancelled
//         }
//       }
      
//       // Sample ZPL code - you may need to adjust this based on the printer type
//       const zpl = `^XA^FO50,50^ADN,36,20^FDTest Print via USB^FS^XZ`;
      
//       // Send to printer
//       const success = await sendToPrinter(deviceToPrint, zpl);
      
//       if (success) {
//         Swal.fire({
//           icon: 'success',
//           title: 'Printed Successfully',
//           text: `Label sent to ${getPrinterTypeString(deviceToPrint)} printer.`,
//           timer: 2000,
//           showConfirmButton: false
//         });
//       }
//     } catch (error) {
//       console.error("Printing error:", error);
//       Swal.fire({
//         icon: 'error',
//         title: 'Printing Failed',
//         text: `Error: ${error.message || 'Unknown error occurred'}`,
//         confirmButtonColor: '#d33',
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Check for already-paired printers on component mount
//   useEffect(() => {
//     const checkAvailablePrinters = async () => {
//       const printers = await detectPrinters();
//       setAvailablePrinters(printers);
//     };
    
//     checkAvailablePrinters();
//   }, []);

//   return (
//     <div className="container">
//       <h1>USB Label Print Demo</h1>
//       <p>
//         {availablePrinters.length > 0 
//           ? `${availablePrinters.length} printer(s) connected` 
//           : 'No printers detected'}
//       </p>
//       <button
//         className="print-button"
//         onClick={handlePrint}
//         disabled={isLoading}
//         style={{
//           backgroundColor: '#3085d6',
//           color: 'white',
//           padding: '10px 20px',
//           border: 'none',
//           borderRadius: '5px',
//           cursor: isLoading ? 'not-allowed' : 'pointer',
//           opacity: isLoading ? 0.7 : 1
//         }}
//       >
//         {isLoading ? 'Printing...' : 'Print via USB'}
//       </button>
      
//       {availablePrinters.length > 0 && (
//         <div className="printer-list" style={{ marginTop: '20px' }}>
//           <h3>Connected Printers:</h3>
//           <ul>
//             {availablePrinters.map((printer, index) => (
//               <li key={index}>
//                 {getPrinterTypeString(printer)} 
//                 {printer.serialNumber ? ` (S/N: ${printer.serialNumber})` : ''}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;



import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './App.css';

function App() {
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState('');

  // Known printer configurations
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
    }
  };

  // Helper to determine if we're on a mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const detectPrinters = async () => {
    try {
      const devices = await navigator.usb.getDevices();
      
      const printers = devices.filter(device => 
        (device.vendorId === PRINTERS.BEEPRT.vendorId && device.productId === PRINTERS.BEEPRT.productId) ||
        (device.vendorId === PRINTERS.ZEBRA.vendorId && device.productId === PRINTERS.ZEBRA.productId)
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
    let deviceWasReopened = false;
    
    try {
      // Make sure device is closed first to avoid locked states
      if (device.opened) {
        await device.close();
      }
      
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
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
          
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
          
          // Now try claiming our interface again
          await device.claimInterface(endpointInfo.interfaceNumber);
          deviceWasReopened = true;
        } else {
          throw claimError; // Re-throw if not mobile or if our fix didn't work
        }
      }
      
      // For Zebra printers, the format might need to be different
      const isPrinterZebra = device.vendorId === PRINTERS.ZEBRA.vendorId;
      
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
      
      // On mobile, smaller chunks might work better
      let result;
      if (isMobileDevice() && data.length > 4096) {
        // Break into smaller chunks for mobile
        const chunkSize = 4096;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          result = await device.transferOut(endpointInfo.endpointNumber, chunk);
          
          if (result.status !== 'ok') {
            throw new Error(`Transfer gagal pada chunk ${i/chunkSize + 1}: ${result.status}`);
          }
          
          // Small delay between chunks
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        // Send all at once for desktop
        result = await device.transferOut(endpointInfo.endpointNumber, data);
      }
      
      if (result.status === 'ok') {
        return true;
      } else {
        throw new Error(`Transfer gagal dengan status: ${result.status}`);
      }
    } catch (error) {
      console.error("Printer error:", error);
      setLastError(`Error: ${error.toString()}`);
      
      // If we're on mobile and haven't tried resetting yet, try a reset
      if (isMobileDevice() && !deviceWasReopened) {
        console.log("Mencoba reset perangkat...");
        await resetDevice(device);
      }
      
      throw error;
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
  };

  const getPrinterTypeString = (device) => {
    if (device.vendorId === PRINTERS.BEEPRT.vendorId) {
      return "Beeprt/Kassen";
    } else if (device.vendorId === PRINTERS.ZEBRA.vendorId) {
      return "Zebra";
    } else {
      return `Unknown (${device.vendorId.toString(16)}:${device.productId.toString(16)})`;
    }
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
          const device = await navigator.usb.requestDevice({
            filters: [
              { vendorId: PRINTERS.BEEPRT.vendorId },
              { vendorId: PRINTERS.ZEBRA.vendorId }
            ]
          });
          deviceToPrint = device;
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
      
      // Sample ZPL code - you may need to adjust this based on the printer type
      const zpl = `^XA^FO50,50^ADN,36,20^FDTest Print via USB^FS^XZ`;
      
      // Display loading notification on mobile
      let loadingNotification;
      if (isMobileDevice()) {
        loadingNotification = Swal.fire({
          title: 'Mengirim ke printer...',
          text: 'Mohon tunggu',
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
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mencetak',
        text: `Error: ${error.message || 'Terjadi kesalahan tidak diketahui'}`,
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check for already-paired printers on component mount
  useEffect(() => {
    const checkAvailablePrinters = async () => {
      const printers = await detectPrinters();
      setAvailablePrinters(printers);
    };
    
    checkAvailablePrinters();
    
    // Add event listener for device connects/disconnects
    navigator.usb.addEventListener('connect', checkAvailablePrinters);
    navigator.usb.addEventListener('disconnect', checkAvailablePrinters);
    
    return () => {
      navigator.usb.removeEventListener('connect', checkAvailablePrinters);
      navigator.usb.removeEventListener('disconnect', checkAvailablePrinters);
    };
  }, []);

  return (
    <div className="container">
      <h1>USB Label Print Demo</h1>
      <p>
        {availablePrinters.length > 0 
          ? `${availablePrinters.length} printer terhubung` 
          : 'Tidak ada printer terdeteksi'}
      </p>
      <button
        className="print-button"
        onClick={handlePrint}
        disabled={isLoading}
        style={{
          backgroundColor: '#3085d6',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? 'Sedang Mencetak...' : 'Cetak via USB'}
      </button>
      
      {lastError && (
        <div className="error-message" style={{ 
          marginTop: '10px', 
          color: 'red',
          fontSize: '14px'
        }}>
          Pesan error terakhir: {lastError}
        </div>
      )}
      
      {availablePrinters.length > 0 && (
        <div className="printer-list" style={{ marginTop: '20px' }}>
          <h3>Printer Terhubung:</h3>
          <ul>
            {availablePrinters.map((printer, index) => (
              <li key={index}>
                {getPrinterTypeString(printer)} 
                {printer.serialNumber ? ` (S/N: ${printer.serialNumber})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isMobileDevice() && (
        <div className="mobile-info" style={{ 
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px', 
          fontSize: '14px' 
        }}>
          <p><strong>Info untuk Perangkat Mobile:</strong> Pastikan browser Anda mendukung WebUSB dan printer terhubung dengan benar melalui OTG.</p>
        </div>
      )}
    </div>
  );
}

export default App;