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
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './App.css';

function App() {
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const sendToPrinter = async (device, zpl) => {
    try {
      await device.open();
      
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      
      const endpointInfo = findOutEndpoint(device);
      if (!endpointInfo) {
        throw new Error('No OUT endpoint found on this device');
      }
      
      await device.claimInterface(endpointInfo.interfaceNumber);
      
      // For Zebra printers, the format might need to be different
      const isPrinterZebra = device.vendorId === PRINTERS.ZEBRA.vendorId;
      const printData = isPrinterZebra 
        ? zpl
        : zpl; // Same for now, but you could customize per printer if needed
      
      const encoder = new TextEncoder();
      const data = encoder.encode(printData);
      
      const result = await device.transferOut(endpointInfo.endpointNumber, data);
      
      if (result.status === 'ok') {
        return true;
      } else {
        throw new Error(`Transfer failed with status: ${result.status}`);
      }
    } finally {
      try {
        // Close the device connection
        if (device.opened) {
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
    try {
      // First check if we already have permissions to any printers
      const existingDevices = await detectPrinters();
      
      let deviceToPrint;
      
      if (existingDevices.length === 0) {
        // No printers with permissions, request access
        const device = await navigator.usb.requestDevice({
          filters: [
            { vendorId: PRINTERS.BEEPRT.vendorId },
            { vendorId: PRINTERS.ZEBRA.vendorId }
          ]
        });
        deviceToPrint = device;
      } else if (existingDevices.length === 1) {
        // Only one printer available, use it directly
        deviceToPrint = existingDevices[0];
      } else {
        // Multiple printers available, let user choose
        const result = await Swal.fire({
          title: 'Select Printer',
          input: 'select',
          inputOptions: existingDevices.reduce((acc, device, index) => {
            acc[index] = `${getPrinterTypeString(device)} (${device.serialNumber || 'No Serial'})`;
            return acc;
          }, {}),
          inputPlaceholder: 'Select a printer',
          showCancelButton: true,
          inputValidator: (value) => {
            return new Promise((resolve) => {
              if (value !== '') {
                resolve();
              } else {
                resolve('You need to select a printer');
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
      
      // Send to printer
      const success = await sendToPrinter(deviceToPrint, zpl);
      
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Printed Successfully',
          text: `Label sent to ${getPrinterTypeString(deviceToPrint)} printer.`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error("Printing error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Printing Failed',
        text: `Error: ${error.message || 'Unknown error occurred'}`,
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
  }, []);

  return (
    <div className="container">
      <h1>USB Label Print Demo</h1>
      <p>
        {availablePrinters.length > 0 
          ? `${availablePrinters.length} printer(s) connected` 
          : 'No printers detected'}
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
        {isLoading ? 'Printing...' : 'Print via USB'}
      </button>
      
      {availablePrinters.length > 0 && (
        <div className="printer-list" style={{ marginTop: '20px' }}>
          <h3>Connected Printers:</h3>
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
    </div>
  );
}

export default App;

