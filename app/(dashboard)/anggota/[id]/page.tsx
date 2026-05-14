"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAnggotaDetailByIdAction } from "@/actions/anggota-action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  UserCheck, 
  Building2, 
  Calendar, 
  Phone, 
  MapPin, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowDownLeft, 
  ArrowUpRight,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

export default function DetailAnggotaPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const decodedId = rawId ? decodeURIComponent(rawId) : "";

  const [member, setMember] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTabRekeningId, setActiveTabRekeningId] = useState<string | null>(null);

  // Feedback State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: FeedbackType;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    description: "",
  });

  const showModal = (type: FeedbackType, title: string, description: string) => {
    setModalState({ isOpen: true, type, title, description });
  };

  useEffect(() => {
    async function loadData() {
      if (!decodedId) return;
      setIsLoading(true);
      try {
        const res = await getAnggotaDetailByIdAction(decodedId);
        if (res.success && res.data) {
          setMember(res.data);
          // Set rekening pertama sebagai tab aktif secara default jika ada
          if (res.data.rekeningSimpanan && res.data.rekeningSimpanan.length > 0) {
            setActiveTabRekeningId(res.data.rekeningSimpanan[0].id);
          }
        } else {
          showModal("error", "Data Tidak Ditemukan", res.error || "Gagal memuat rincian arsip keanggotaan.");
        }
      } catch (e: any) {
        showModal("error", "Galat Sistem", "Terjadi kegagalan koneksi saat mengambil riwayat anggota.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [decodedId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium animate-pulse">Mengambil portofolio lengkap Buku Induk Anggota...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Arsip Keanggotaan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Data pendaftaran dengan kata kunci pengenal bersangkutan tidak tercatat di dalam pangkalan data terpusat Koperasi-AI.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push("/anggota")}
          className="text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Kembali ke Buku Induk
        </Button>
      </div>
    );
  }

  // Hitung agregat portofolio
  const totalPortofolio = member.rekeningSimpanan?.reduce((acc: number, r: any) => acc + Number(r.saldo || 0), 0) || 0;
  const activeRekening = member.rekeningSimpanan?.find((r: any) => r.id === activeTabRekeningId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Tombol Kembali & Navigasi Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push("/anggota")}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 pl-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Senarai Buku Induk
        </Button>

        <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-md">
          Arsip Internal ID: {member.id}
        </span>
      </div>

      {/* ── HEADER HALAMAN DENGAN DESAIN PREMIUM ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial-gradient from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 font-bold bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/40">
                Profil Anggota Resmi
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${
                member.status === "AKTIF" 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}>
                {member.status || "MENUNGGU"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {member.namaLengkap}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1 font-mono">
              <span>NIK: {member.nik}</span>
              <span>•</span>
              <span>Bergabung: {member.createdAt ? new Date(member.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</span>
            </div>
          </div>

          {/* Kotak Agregat Saldo Utama */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 self-start md:self-auto min-w-[220px]">
            <span className="text-[10px] uppercase tracking-wider block text-slate-300 font-bold flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-400" /> Total Portofolio Simpanan
            </span>
            <span className="text-xl font-mono font-bold text-emerald-400 block mt-1">
              Rp {totalPortofolio.toLocaleString("id-ID")}
            </span>
            <span className="text-[9px] text-slate-400 block mt-1">
              Tersebar di {member.rekeningSimpanan?.length || 0} unit rekening
            </span>
          </div>
        </div>
      </div>

      {/* ── GRID UTAMA: Rincian KYC & Portofolio ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Rincian Lengkap KYC & Dokumen Identitas (1 Kolom) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200/80 shadow-xs overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Kepatuhan & Validasi KYC
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {/* Lencana Otentikasi E-KTP */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                member.ocrVerified 
                  ? "bg-blue-50/50 border-blue-100 text-blue-900" 
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${member.ocrVerified ? "bg-blue-600 animate-pulse" : "bg-slate-400"}`} />
                <div className="space-y-0.5">
                  <span className="font-bold block text-[11px]">
                    {member.ocrVerified ? "E-KTP Tervalidasi Sistem AI (OCR)" : "E-KTP Belum Diverifikasi"}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block">
                    {member.ocrVerified 
                      ? "Identitas dijamin akurat berdasarkan ekstraksi optikal dari dokumen pendukung fisik."
                      : "Pemeriksaan dokumen identitas murni secara manual."}
                  </span>
                </div>
              </div>

              {/* Rincian Atribut */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Tempat, Tanggal Lahir
                  </span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {member.tempatLahir || "-"}, {member.tanggalLahir ? new Date(member.tanggalLahir).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block flex items-center gap-1.5">
                    <UserCheck className="w-3 h-3" /> Jenis Kelamin
                  </span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {member.jenisKelamin || "Laki-Laki"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Nomor Ponsel (HP)
                  </span>
                  <span className="font-mono font-bold text-slate-800 block mt-0.5">
                    {member.noHp || "Belum dicantumkan"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Alamat Domisili KTP
                  </span>
                  <span className="font-medium text-slate-700 block mt-0.5 leading-relaxed">
                    {member.alamat || "Alamat domisili belum didaftarkan pada arsip pangkalan data."}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kotak Info Singkat Koperasi */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-blue-900">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold block mb-0.5">Prinsip Keanggotaan:</span>
              Seluruh rekam jejak portofolio simpanan anggota terikat secara permanen pada NIK kependudukan guna menghindari ganda data.
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Portofolio Sub-Rekening & Riwayat Transaksi (2 Kolom) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daftar Sub-Rekening Simpanan */}
          <Card className="border-slate-200/80 shadow-xs overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold text-slate-800">
                  Unit Sub-Rekening Terdaftar ({member.rekeningSimpanan?.length || 0})
                </CardTitle>
                <CardDescription className="text-[10px] mt-0.5">
                  Klik pada unit kartu rekening untuk menelaah mutasi buku besar per akun
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {(!member.rekeningSimpanan || member.rekeningSimpanan.length === 0) ? (
                <div className="text-center py-8 text-xs text-slate-400 font-medium border border-dashed rounded-xl">
                  Belum ada pembukaan rekening simpanan terotorisasi untuk anggota bersangkutan.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {member.rekeningSimpanan.map((rek: any) => {
                    const isSelected = rek.id === activeTabRekeningId;
                    return (
                      <div
                        key={rek.id}
                        onClick={() => setActiveTabRekeningId(rek.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-blue-50/40 border-blue-500/60 shadow-2xs ring-1 ring-blue-500/20" 
                            : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold text-slate-800 block">
                            {rek.noRekening}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase border">
                            {rek.produk?.jenis || "SUKARELA"}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                          {rek.produk?.namaProduk || "Simpanan Koperasi"}
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-600 mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-sans font-normal">Saldo Kas</span>
                          <span>Rp {Number(rek.saldo || 0).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Riwayat Mutasi Lengkap untuk Sub-Rekening Aktif Terpilih */}
          {activeRekening && (
            <Card className="border-slate-200/80 shadow-xs overflow-hidden rounded-2xl animate-in fade-in duration-200">
              <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Riwayat Buku Tabungan (Mutasi Rekening)
                  </CardTitle>
                  <CardDescription className="text-[10px] mt-0.5 font-mono text-slate-500">
                    Akun: {activeRekening.noRekening} • {activeRekening.produk?.namaProduk || "Simpanan"}
                  </CardDescription>
                </div>
                <span className="text-[10px] font-bold bg-white px-2.5 py-1 rounded-md border text-slate-600">
                  {activeRekening.mutasi?.length || 0} Entri Tercatat
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {(!activeRekening.mutasi || activeRekening.mutasi.length === 0) ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium">
                    Belum ada pencatatan mutasi penyetoran maupun penarikan pada sub-rekening ini.
                  </div>
                ) : (
                  <div className="max-h-[350px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100">
                        <TableRow>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase w-24">Tanggal</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase">Jenis Mutasi</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase text-right">Nominal</TableHead>
                          <TableHead className="text-[10px] font-bold text-slate-400 uppercase text-right">Saldo Setelah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeRekening.mutasi.map((mut: any) => {
                          const isKredit = mut.jenis === "KREDIT"; // Setoran menambah saldo tabungan
                          return (
                            <TableRow key={mut.id} className="hover:bg-slate-50/40 text-xs">
                              <TableCell className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {mut.createdAt ? new Date(mut.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {isKredit ? (
                                    <span className="flex items-center gap-1 font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                      <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> SETORAN
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 font-bold text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                      <ArrowUpRight className="w-3 h-3 text-rose-600" /> PENARIKAN
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">
                                  {mut.keterangan || "-"}
                                </span>
                              </TableCell>
                              <TableCell className={`text-right font-mono font-bold text-xs ${isKredit ? "text-emerald-600" : "text-rose-600"}`}>
                                {isKredit ? "+" : "-"} Rp {Number(mut.nominal || mut.jumlah || 0).toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-xs text-slate-800">
                                Rp {Number(mut.saldoSetelah || 0).toLocaleString("id-ID")}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Feedback Modal ── */}
      <FeedbackModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        type={modalState.type}
        title={modalState.title}
        description={modalState.description}
      />
    </div>
  );
}
