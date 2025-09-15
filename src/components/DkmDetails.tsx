"use client";

import { useState, useEffect } from 'react';
import type { DkmData } from '@/context/AppProvider';
import StickyInfoBox from './StickyInfoBox';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface Ptk {
  nama: string;
}
interface SchoolData {
  id: string;
  name: string;
  address: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kepalaSekolah: string;
  ptk: Ptk[];
}

const InfoField = ({ label, value, colSpan, isMismatched }: { label: string; value: string; colSpan: string; isMismatched: boolean }) => (
    <div className={colSpan}>
        <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
        <input type="text" className={`w-full p-2 border rounded-md text-sm focus:outline-none text-gray-800 transition-colors ${isMismatched ? 'bg-red-100 border-red-400' : 'bg-gray-100 border-gray-300'}`} value={value || ''} readOnly />
    </div>
);

export default function DkmDetails({ data }: { data: DkmData }) {
    const [isProsesOpen, setIsProsesOpen] = useState(false);
    const [isDokumentasiOpen, setIsDokumentasiOpen] = useState(true);
    const [apiData, setApiData] = useState<SchoolData | null>(null);
    const [mismatches, setMismatches] = useState<Record<string, boolean>>({});
    const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
    const imageList = data.images ? Object.values(data.images) : [];

    const cleanAndCompare = (val1?: string, val2?: string) => {
        if (typeof val1 !== "string" || typeof val2 !== "string") return false;
        return val1.trim().toLowerCase() === val2.trim().toLowerCase();
    };
    
    useEffect(() => {
        if (!data?.schoolInfo?.NPSN) return;
        setApiData(null); setMismatches({});
        fetch(`/api/school-data/${data.schoolInfo.NPSN}`)
            .then(res => res.json())
            .then(fetchedData => { if (fetchedData && !fetchedData.error) setApiData(fetchedData); })
            .catch(err => console.error("Gagal mengambil data API sekolah:", err));
    }, [data.schoolInfo?.NPSN]);

    useEffect(() => {
        if (data && apiData) {
            const newMismatches: Record<string, boolean> = {};
            newMismatches['Nama'] = !cleanAndCompare(data.schoolInfo.Nama, apiData.name);
            newMismatches['Alamat'] = !cleanAndCompare(data.schoolInfo.Alamat, apiData.address);
            newMismatches['Kecamatan'] = !cleanAndCompare(data.schoolInfo.Kecamatan, apiData.kecamatan);
            newMismatches['Kabupaten'] = !cleanAndCompare(data.schoolInfo.Kabupaten, apiData.kabupaten);
            newMismatches['PIC'] = !cleanAndCompare(data.schoolInfo.PIC, apiData.kepalaSekolah);
            setMismatches(newMismatches);
        }
    }, [data, apiData]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (currentImageIndex === null) return;
            if (event.key === 'Escape') setCurrentImageIndex(null);
            if (event.key === 'ArrowRight') setCurrentImageIndex(prev => (prev! + 1) % imageList.length);
            if (event.key === 'ArrowLeft') setCurrentImageIndex(prev => (prev! - 1 + imageList.length) % imageList.length);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentImageIndex, imageList.length]);

    return (
        <>
            {currentImageIndex !== null && apiData && (
              <StickyInfoBox
                formData={data.schoolInfo}
                apiData={apiData}
                ptkList={apiData.ptk || []}
              />
            )}
            <div className="w-full bg-white p-6 rounded-lg shadow-lg flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-12 gap-4">
                        <InfoField label="NPSN" value={data.schoolInfo.NPSN} colSpan="col-span-12 md:col-span-2" isMismatched={false} />
                        <InfoField label="Nama" value={data.schoolInfo.Nama} colSpan="col-span-12 md:col-span-4" isMismatched={!!mismatches['Nama']} />
                        <InfoField label="Alamat" value={data.schoolInfo.Alamat} colSpan="col-span-12 md:col-span-6" isMismatched={!!mismatches['Alamat']} />
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                        <InfoField label="Provinsi" value={data.schoolInfo.Provinsi} colSpan="col-span-6 md:col-span-2" isMismatched={false} />
                        <InfoField label="Kabupaten" value={data.schoolInfo.Kabupaten} colSpan="col-span-6 md:col-span-2" isMismatched={!!mismatches['Kabupaten']} />
                        <InfoField label="Kecamatan" value={data.schoolInfo.Kecamatan} colSpan="col-span-6 md:col-span-2" isMismatched={!!mismatches['Kecamatan']} />
                        <InfoField label="Kelurahan/Desa" value={data.schoolInfo['Kelurahan/Desa']} colSpan="col-span-6 md:col-span-2" isMismatched={false} />
                        <InfoField label="Jenjang" value={data.schoolInfo.Jenjang} colSpan="col-span-4 md:col-span-1" isMismatched={false} />
                        <InfoField label="Bentuk" value={data.schoolInfo.Bentuk} colSpan="col-span-4 md:col-span-1" isMismatched={false} />
                        <InfoField label="Sekolah" value={data.schoolInfo.Sekolah} colSpan="col-span-4 md:col-span-1" isMismatched={false} />
                        <InfoField label="Formal" value={data.schoolInfo.Formal} colSpan="col-span-4 md:col-span-1" isMismatched={false} />
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                        <InfoField label="PIC" value={data.schoolInfo.PIC} colSpan="col-span-6 md:col-span-2" isMismatched={!!mismatches['PIC']} />
                        <InfoField label="Telp" value={data.schoolInfo['Telp PIC']} colSpan="col-span-6 md:col-span-2" isMismatched={false} />
                        <InfoField label="Resi Pengiriman" value={data.schoolInfo['Resi Pengiriman']} colSpan="col-span-12 md:col-span-2" isMismatched={false} />
                        <InfoField label="Serial Number" value={data.schoolInfo['Serial Number']} colSpan="col-span-12 md:col-span-3" isMismatched={false} />
                        <InfoField label="Status" value={data.schoolInfo.Status} colSpan="col-span-12 md:col-span-3" isMismatched={false} />
                    </div>
                </div>
                <div>
                    <button onClick={() => setIsProsesOpen(!isProsesOpen)} className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                        <span className="font-semibold text-blue-600">Rincian Proses</span>
                        <span className={`transform transition-transform ${isProsesOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {isProsesOpen && ( <div className="p-3 mt-2 border rounded-md max-h-60 overflow-y-auto text-xs"> <table className="table-auto w-full"><thead><tr className="text-left bg-gray-50"><th className="p-2">Tanggal</th><th className="p-2">Status</th><th className="p-2">Keterangan</th></tr></thead><tbody>{data.processHistory.map((item, index) => (<tr key={index} className="border-t hover:bg-gray-50"><td className="p-2">{item.tanggal}</td><td className="p-2">{item.status}</td><td className="p-2">{item.keterangan}</td></tr>))}</tbody></table></div>)}
                </div>
                <div>
                    <button onClick={() => setIsDokumentasiOpen(!isDokumentasiOpen)} className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                        <span className="font-semibold text-blue-600">Dokumentasi Instalasi</span>
                        <span className={`transform transition-transform ${isDokumentasiOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {isDokumentasiOpen && (
                        <div className="p-4 mt-2 border rounded-md grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        {Object.entries(data.images).map(([key, value], index) => (
                            <div key={key} className="flex flex-col items-center">
                                <span className="text-xs font-bold mb-2">{key}</span>
                                <div onClick={() => setCurrentImageIndex(index)} className="cursor-pointer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={value} alt={key} className="border rounded-md h-32 w-full object-cover hover:opacity-80 transition-opacity" />
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
            </div>
            {currentImageIndex !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-50 p-4" onClick={() => setCurrentImageIndex(null)}>
                    <TransformWrapper initialScale={1} key={currentImageIndex}>
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                <div className="absolute top-4 right-4 z-[51] flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button title="Zoom In" onClick={() => zoomIn()} className="bg-white text-black w-10 h-10 rounded-full font-bold text-xl shadow-lg">+</button>
                                    <button title="Zoom Out" onClick={() => zoomOut()} className="bg-white text-black w-10 h-10 rounded-full font-bold text-xl shadow-lg">-</button>
                                    <button title="Reset Zoom" onClick={() => resetTransform()} className="bg-white text-black px-4 h-10 rounded-full font-semibold shadow-lg">Reset</button>
                                </div>
                                <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                    <TransformComponent wrapperStyle={{ maxWidth: '100%', maxHeight: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imageList[currentImageIndex]} alt="Tampilan Penuh" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl" />
                                    </TransformComponent>
                                </div>
                            </>
                        )}
                    </TransformWrapper>
                    <button title="Gambar Sebelumnya (Panah Kiri)" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev! - 1 + imageList.length) % imageList.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:opacity-75 transition-opacity">&#10094;</button>
                    <button title="Gambar Berikutnya (Panah Kanan)" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev! + 1) % imageList.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:opacity-75 transition-opacity">&#10095;</button>
                </div>
            )}
        </>
    );
}