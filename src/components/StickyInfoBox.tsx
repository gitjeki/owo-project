"use client";

// [3] Hapus 'RefObject' karena tidak digunakan
import { useRef } from 'react';
import type { DkmData } from '@/context/AppProvider';
import { useDraggable } from '@/hooks/useDraggable';

// [2] Definisikan tipe untuk apiData untuk menggantikan 'any'
interface SchoolData {
  address: string;
  kecamatan: string;
  kabupaten: string;
  kepalaSekolah: string;
  name: string;
  // tambahkan properti lain jika ada
}

interface StickyInfoBoxProps {
  formData: DkmData['schoolInfo'];
  apiData: SchoolData; // Gunakan tipe yang sudah didefinisikan
}

const cleanAndCompare = (val1?: string, val2?: string) => {
    if (typeof val1 !== "string" || typeof val2 !== "string") return false;
    return val1.trim().toLowerCase() === val2.trim().toLowerCase();
};

export default function StickyInfoBox({ formData, apiData }: StickyInfoBoxProps) {
  // [1] Pindahkan pemanggilan Hooks ke bagian paling atas komponen
  // Ini untuk mematuhi Aturan Pemanggilan Hooks
  const boxRef = useRef<HTMLDivElement>(null!);
  const { position, handleMouseDown } = useDraggable<HTMLDivElement>(boxRef, "sticky-info-box");
  
  // Return awal (early return) sekarang aman dilakukan setelah Hooks dipanggil
  if (!formData || !apiData) return null;

  const isAddressMatch = cleanAndCompare(formData.Alamat, apiData.address) &&
                       cleanAndCompare(formData.Kecamatan, apiData.kecamatan) &&
                       cleanAndCompare(formData.Kabupaten, apiData.kabupaten);

  const statusColor = isAddressMatch ? "#e8f5e9" : "#ffdddd";
  const borderColor = isAddressMatch ? "#66bb6a" : "#e57373";

  return (
    <div 
      ref={boxRef}
      style={{ 
        position: 'fixed', 
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 1000,
        maxWidth: '300px', 
        padding: '0',
        borderRadius: '8px',
        fontFamily: 'sans-serif', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        backgroundColor: statusColor, 
        border: `2px solid ${borderColor}`,
        transition: 'background-color 0.3s, border-color 0.3s'
      }}
    >
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{ 
          padding: '8px 18px',
          cursor: 'move',
          borderBottom: `1px solid ${borderColor}`,
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#0056b3' }}>{formData.Nama}</div>
        <div style={{ fontSize: '12px', color: '#555' }}>NPSN: {formData.NPSN}</div>
      </div>

      <div style={{ padding: '8px 18px 12px 18px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Serial Number</div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#000', wordWrap: 'break-word' }}>{formData['Serial Number']}</div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#333' }}><b>Alamat API:</b> {apiData.address || 'N/A'}</div>
        <div style={{ marginTop: '5px', fontSize: '12px', fontWeight: 'bold', color: '#0056b3' }}><b>Kepala Sekolah:</b> {apiData.kepalaSekolah || "N/A"}</div>
      </div>
    </div>
  );
}