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


import Swal from 'sweetalert2';
import './App.css';

function App() {
  const handlePrint = async () => {
    try {
      const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x09C6 }] // Beeprt, Kassen, Zebra clone
      });

      await device.open();

      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Temukan interface dengan endpoint OUT
      const outInterface = device.configuration.interfaces.find(iface =>
        iface.alternate.endpoints.some(ep => ep.direction === 'out')
      );

      if (!outInterface) {
        throw new Error('Tidak ada interface dengan endpoint OUT ditemukan.');
      }

      const interfaceNumber = outInterface.interfaceNumber;
      await device.claimInterface(interfaceNumber);

      const endpointOut = outInterface.alternate.endpoints.find(ep => ep.direction === 'out');

      if (!endpointOut) {
        throw new Error('Tidak menemukan endpoint OUT.');
      }

      const zpl = `^XA^FO50,50^ADN,36,20^FDTest Print via USB^FS^XZ`;
      const encoder = new TextEncoder();
      const data = encoder.encode(zpl);

      const result = await device.transferOut(endpointOut.endpointNumber, data);

      if (result.status === 'ok') {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Label has been successfully sent to the USB printer.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(`Transfer failed. Status: ${result.status}`);
      }

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: 'Failed to send to printer. Check USB connection & permissions.',
        confirmButtonColor: '#d33',
      });
    }
  };

  return (
    <div className="container">
      <h1>USB Label Print Demo</h1>
      <button
        className="print-button"
        onClick={handlePrint}
        style={{
          backgroundColor: '#3085d6',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Print via USB
      </button>
    </div>
  );
}

export default App;



