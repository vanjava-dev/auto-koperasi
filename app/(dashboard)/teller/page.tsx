"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw, 
  Building2, 
  Users, 
  Plus, 
  Minus, 
  UserCheck, 
  X, 
  FileText 
} from "lucide-react";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { fetchTellerOptions, processTellerSetoran, processTellerPenarikan, processTellerOperasional, createTellerXenditInvoiceAction, saveKategoriAction, deleteKategoriAction } from "@/actions/teller";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, ChevronRight, HelpCircle, AlertCircle } from "lucide-react";

export default function TellerPage() {
  // Mode Utama: Transaksi Anggota vs Operasional Kantor
  const [txMode, setTxMode] = useState<"anggota" | "operasional">("anggota");

  // State Rujukan Pangkalan Data Nyata
  const [dbOptions, setDbOptions] = useState<{
    rekening: any[];
    allCoas: any[];
    kategoriList: any[];
    coaKasId: string;
    coaSimpananId: string;
    koperasiId: string;
  }>({
    rekening: [],
    allCoas: [],
    kategoriList: [],
    coaKasId: "COA-101-01",
    coaSimpananId: "COA-201-01",
    koperasiId: "KOP-MASTER",
  });

  // State Pencarian Anggota
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRekening, setFilteredRekening] = useState<any[]>([]);

  // State Dialog List Rekening Anggota Terpilih
  const [selectedMemberDialog, setSelectedMemberDialog] = useState<{
    isOpen: boolean;
    memberId: string;
    namaLengkap: string;
    nik: string;
    anggotaObj?: any;
    rekeningList: any[];
  }>({
    isOpen: false,
    memberId: "",
    namaLengkap: "",
    nik: "",
    anggotaObj: null,
    rekeningList: [],
  });

  // State Modal Form Transaksi Anggota
  const [memberModal, setMemberModal] = useState<{
    isOpen: boolean;
    type: "setor" | "tarik";
    rekening: any | null;
  }>({
    isOpen: false,
    type: "setor",
    rekening: null,
  });

  // Form State Transaksi Anggota (Nominal murni kosong)
  const [memberFormData, setMemberFormData] = useState({
    nominal: "",
    metode: "TUNAI",
    vaBank: "MANDIRI",
    keterangan: "",
  });

  // State Dialog Checkout/Simulasi Xendit Payment Gateway
  const [xenditInvoiceDialog, setXenditInvoiceDialog] = useState<{
    isOpen: boolean;
    externalId: string;
    nominal: number;
    metode: string;
    vaNumber?: string;
    bankName?: string;
    qrisString?: string;
    invoiceUrl?: string;
  }>({
    isOpen: false,
    externalId: "",
    nominal: 0,
    metode: "VA",
  });

  // State Modal Form Transaksi Operasional Kantor
  const [opModal, setOpModal] = useState<{
    isOpen: boolean;
    type: "masuk" | "keluar";
  }>({
    isOpen: false,
    type: "keluar",
  });

  // Form State Transaksi Operasional Kantor (Nominal murni kosong)
  const [opFormData, setOpFormData] = useState({
    kategori: "",
    nominal: "",
    keterangan: "",
  });

  // State Pengelolaan Kategori Transaksi Kustom (CRUD)
  const [katCrudModal, setKatCrudModal] = useState<{
    isOpen: boolean;
    mode: "tambah" | "edit";
    id?: string;
    kode: string;
    nama: string;
    jenis: "MASUK" | "KELUAR";
    deskripsi: string;
    coaId: string;
  }>({
    isOpen: false,
    mode: "tambah",
    kode: "",
    nama: "",
    jenis: "MASUK",
    deskripsi: "",
    coaId: "",
  });

  // State Pemuatan & Pengiriman Data
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKatSaving, setIsKatSaving] = useState(false);

  // State Modal Umpan Balik Global (SOP FeedbackModal)
  const [feedbackState, setFeedbackState] = useState<{
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

  const showFeedback = (type: FeedbackType, title: string, description: string) => {
    setFeedbackState({ isOpen: true, type, title, description });
  };

  // Fungsi untuk memuat ulang opsi peladen teller (misal pasca penambahan/perubahan kategori)
  const reloadTellerOptionsData = async () => {
    setIsLoadingOptions(true);
    try {
      const res = await fetchTellerOptions();
      const rekList = res?.rekening || [];
      const coasList = res?.allCoas || [];
      const katList = res?.kategoriList || [];
      const kasId = res?.coaKas?.id || "COA-101-01";
      const simpId = res?.coaSimpanan?.id || "COA-201-01";
      const kopId = rekList[0]?.anggota?.koperasiId || coasList[0]?.koperasiId || "KOP-MASTER";

      setDbOptions({
        rekening: rekList,
        allCoas: coasList,
        kategoriList: katList,
        coaKasId: kasId,
        coaSimpananId: simpId,
        koperasiId: kopId,
      });

      // Perbarui jika sedang dicari
      if (searchQuery.trim().length >= 2) {
        // Biarkan useEffect filter bekerja
      }
    } catch (e) {
      console.error("Gagal memuat ulang opsi peladen teller:", e);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Muat opsi peladen nyata saat komponen diinisialisasi
  useEffect(() => {
    reloadTellerOptionsData();
  }, []);

  // Logika Filter Pencarian Anggota Dinamis (Sangat Dioptimalkan untuk Ribuan Anggota)
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    // Jika tidak ada kueri atau kueri kurang dari 2 karakter, JANGAN merender senarai
    if (!q || q.length < 2) {
      setFilteredRekening([]);
      return;
    }
    const filtered = dbOptions.rekening.filter(r => 
      r.noRekening.toLowerCase().includes(q) || 
      (r.anggota?.namaLengkap || "").toLowerCase().includes(q) ||
      (r.anggota?.nik || "").toLowerCase().includes(q)
    );
    // Batasi perenderan antarmuka maksimal 12 kartu teratas untuk performa bebas lag
    setFilteredRekening(filtered.slice(0, 12));
  }, [searchQuery, dbOptions.rekening]);

  // Handler Buka Modal Anggota
  const openMemberModal = (rekeningObj: any, txType: "setor" | "tarik") => {
    setMemberModal({
      isOpen: true,
      type: txType,
      rekening: rekeningObj,
    });
    // Setel default form state dengan nominal kosong murni
    setMemberFormData({
      nominal: "",
      metode: "TUNAI",
      vaBank: "MANDIRI",
      keterangan: txType === "setor" ? "Setoran simpanan sukarela" : "Penarikan dana simpanan",
    });
  };

  // Handler Buka Modal Operasional Kantor
  const openOpModal = (opType: "masuk" | "keluar") => {
    setOpModal({
      isOpen: true,
      type: opType,
    });

    const targetJenis = opType === "masuk" ? "MASUK" : "KELUAR";
    const matchingKats = dbOptions.kategoriList.filter(k => k.jenis === targetJenis);
    const defaultKatId = matchingKats.length > 0 ? matchingKats[0].id : "";

    setOpFormData({
      kategori: defaultKatId,
      nominal: "",
      keterangan: opType === "masuk" ? "Pendapatan operasional kantor" : "Pengeluaran operasional kantor",
    });
  };

  // Eksekutor Aksi Server: Transaksi Anggota
  const handleSubmitMemberTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberModal.rekening) return;

    const nom = Number(memberFormData.nominal);
    if (!nom || nom <= 0) {
      showFeedback("error", "Validasi Gagal", "Nominal transaksi wajib diisi dengan angka yang lebih besar dari nol.");
      return;
    }

    setIsSubmitting(true);
    const isSetor = memberModal.type === "setor";

    // Jalur A: Pembuatan Invoice Xendit Dinamis jika Setoran Non-Tunai (VA / QRIS)
    if (isSetor && memberFormData.metode !== "TUNAI") {
      const invRes = await createTellerXenditInvoiceAction({
        rekeningId: memberModal.rekening.id,
        nominal: nom,
        metode: memberFormData.metode,
        vaBank: memberFormData.vaBank,
        keterangan: memberFormData.keterangan || `Setoran via Xendit ${memberFormData.metode}`,
      });

      setIsSubmitting(false);

      if (invRes.success && invRes.paymentDetails) {
        setMemberModal(prev => ({ ...prev, isOpen: false }));
        setXenditInvoiceDialog({
          isOpen: true,
          externalId: invRes.externalId || "",
          nominal: invRes.nominal || nom,
          metode: invRes.metode || memberFormData.metode,
          vaNumber: invRes.paymentDetails.vaNumber,
          bankName: invRes.paymentDetails.bankName,
          qrisString: invRes.paymentDetails.qrisString,
          invoiceUrl: invRes.paymentDetails.invoiceUrl,
        });
      } else {
        showFeedback("error", "Gagal Membuat Tagihan Xendit", invRes.error || "Terjadi kegagalan komunikasi dengan gateway pembayaran Xendit.");
      }
      return;
    }

    // Jalur B: Transaksi Organik / Kas Fisik Langsung
    const payload = {
      rekeningId: memberModal.rekening.id,
      nominal: nom,
      metode: memberFormData.metode,
      keterangan: memberFormData.keterangan || (isSetor ? "Setoran tunai via kasir" : "Penarikan tunai via kasir"),
      coaKasId: dbOptions.coaKasId,
      coaSimpananId: dbOptions.coaSimpananId,
      koperasiId: dbOptions.koperasiId,
    };

    let res;
    if (isSetor) {
      res = await processTellerSetoran(payload);
    } else {
      res = await processTellerPenarikan(payload);
    }

    setIsSubmitting(false);

    if (res.success) {
      // Tutup modal form
      setMemberModal(prev => ({ ...prev, isOpen: false }));
      // Perbarui saldo lokal secara reaktif di antarmuka
      setDbOptions(prev => ({
        ...prev,
        rekening: prev.rekening.map(r => {
          if (r.id === memberModal.rekening.id) {
            const currentSaldo = Number(r.saldo) || 0;
            return {
              ...r,
              saldo: isSetor ? currentSaldo + nom : currentSaldo - nom,
            };
          }
          return r;
        }),
      }));

      showFeedback(
        "success",
        isSetor ? "Setoran Simpanan Sukses" : "Penarikan Tunai Sukses",
        `Bukti transaksi ${isSetor ? "pemasukan" : "pengeluaran"} atas nama ${memberModal.rekening.anggota?.namaLengkap} senilai Rp ${nom.toLocaleString("id-ID")} berhasil dibukukan. Jurnal pembukuan ganda otomatis tercatat pada sistem.`
      );
    } else {
      showFeedback("error", "Transaksi Ditolak", res.error || "Terjadi kesalahan sistem saat memproses pencatatan pembukuan.");
    }
  };

  // Eksekutor Aksi Server: Transaksi Operasional Kantor
  const handleSubmitOpTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opFormData.kategori) {
      showFeedback("error", "Validasi Gagal", "Silakan pilih Kategori Pembayaran/Penerimaan terlebih dahulu.");
      return;
    }

    const nom = Number(opFormData.nominal);
    if (!nom || nom <= 0) {
      showFeedback("error", "Validasi Gagal", "Nominal transaksi wajib diisi dengan nilai uang yang valid.");
      return;
    }

    if (!opFormData.keterangan.trim()) {
      showFeedback("error", "Validasi Gagal", "Keterangan atau uraian transaksi wajib dijabarkan secara jelas.");
      return;
    }

    setIsSubmitting(true);
    const isMasuk = opModal.type === "masuk";
    const res = await processTellerOperasional({
      jenis: isMasuk ? "MASUK" : "KELUAR",
      nominal: nom,
      kategori: opFormData.kategori,
      keterangan: opFormData.keterangan.trim(),
      coaKasId: dbOptions.coaKasId,
      koperasiId: dbOptions.koperasiId,
    });

    setIsSubmitting(false);

    if (res.success) {
      // Tutup modal
      setOpModal(prev => ({ ...prev, isOpen: false }));
      
      showFeedback(
        "success",
        isMasuk ? "Penerimaan Kas Umum Berhasil" : "Pengeluaran Kas Umum Berhasil",
        `Jurnal transaksi operasional senilai Rp ${nom.toLocaleString("id-ID")} untuk kategori [${opFormData.kategori}] sukses dibukukan secara otomatis di belakang layar.`
      );
    } else {
      showFeedback("error", "Transaksi Operasional Gagal", res.error || "Gagal mencatat mutasi jurnal operasional kantor.");
    }
  };

  // Kelompokkan rekening berdasarkan anggota untuk perenderan senarai tabel
  const groupedMembersObj: { [memberId: string]: {
    memberId: string;
    namaLengkap: string;
    nik: string;
    totalSaldo: number;
    anggotaObj?: any;
    rekeningList: any[];
  }} = {};

  const q = searchQuery.trim().toLowerCase();
  if (q.length >= 2) {
    dbOptions.rekening.forEach(r => {
      const match = r.noRekening.toLowerCase().includes(q) || 
                    (r.anggota?.namaLengkap || "").toLowerCase().includes(q) ||
                    (r.anggota?.nik || "").toLowerCase().includes(q);
      if (match && r.anggota?.id) {
        const aId = r.anggota.id;
        if (!groupedMembersObj[aId]) {
          groupedMembersObj[aId] = {
            memberId: aId,
            namaLengkap: r.anggota.namaLengkap || "Anggota Koperasi",
            nik: r.anggota.nik || "-",
            totalSaldo: 0,
            anggotaObj: r.anggota,
            rekeningList: [],
          };
        }
        if (!groupedMembersObj[aId].rekeningList.find((item: any) => item.id === r.id)) {
          groupedMembersObj[aId].rekeningList.push(r);
          groupedMembersObj[aId].totalSaldo += Number(r.saldo) || 0;
        }
      }
    });
  }

  const groupedMembers = Object.values(groupedMembersObj);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── HEADER HALAMAN DENGAN DESAIN PREMIUM ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Meja Kasir & Teller</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Garda terdepan operasional kasir fisik koperasi. Seluruh eksekusi diotorisasi otomatis ke dalam entri jurnal buku besar ganda.
            </p>
          </div>
          {/* Status Kesiapan */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-200">Koneksi DB Tersinkron</span>
          </div>
        </div>
      </div>

      {/* ── NAVIGASI TABS MODE UTAMA (Anggota vs Operasional Kantor) ── */}
      <div className="flex p-1.5 bg-slate-100/90 rounded-xl shadow-xs max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setTxMode("anggota")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all ${
            txMode === "anggota"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          Transaksi Anggota
        </button>
        <button
          type="button"
          onClick={() => setTxMode("operasional")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all ${
            txMode === "operasional"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-600" />
          Operasional Kantor
        </button>
      </div>

      {/* ── JALUR MODE 1: TRANSAKSI ANGGOTA ── */}
      {txMode === "anggota" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Instruksi Alur Kerja Default */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-blue-900">
            <UserCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="font-bold">Prosedur Operasional Standar (SOP):</strong> Silakan cari identitas anggota berdasarkan Nama Lengkap, NIK, atau Nomor Rekening terlebih dahulu pada bilah di bawah. Setelah anggota bersangkutan dipastikan benar, klik tombol <span className="font-bold text-emerald-700">Setor Simpanan</span> atau <span className="font-bold text-rose-700">Tarik Dana</span> untuk memunculkan formulir transaksi pengamanan.
            </div>
          </div>

          {/* Bilah Pencarian Utama */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik Nomor Rekening / Nama Lengkap / NIK Anggota untuk menyaring secara instan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Bersihkan
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* List Daftar Anggota / Hasil Pencarian dalam Bentuk Tabel Premium */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hasil Pencarian Anggota {searchQuery.trim().length >= 2 ? `(${groupedMembers.length} Anggota / ${filteredRekening.length} Rekening)` : ""}
              </h3>
              {isLoadingOptions && (
                <span className="text-xs text-blue-600 font-medium animate-pulse">Memuat referensi peladen...</span>
              )}
            </div>

            {!searchQuery.trim() || searchQuery.trim().length < 2 ? (
              <Card className="border border-slate-200 bg-white text-center py-16 shadow-xs rounded-2xl">
                <CardContent className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Menunggu Parameter Pencarian</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed sm:px-4">
                    Untuk efisiensi pemrosesan dan keamanan privasi data anggota, sistem tidak menampilkan ribuan daftar rekening secara langsung. Silakan ketik minimal <span className="font-semibold text-slate-700">2 karakter Nama, NIK, atau Nomor Rekening</span> pada bilah di atas.
                  </p>
                </CardContent>
              </Card>
            ) : groupedMembers.length === 0 ? (
              <Card className="border border-dashed border-slate-200 bg-rose-50/40 text-center py-12 shadow-none rounded-2xl">
                <CardContent className="space-y-2">
                  <p className="text-sm font-bold text-rose-800">Anggota Tidak Ditemukan</p>
                  <p className="text-xs text-rose-600/80 max-w-sm mx-auto">
                    Pencarian dengan kata kunci "{searchQuery}" tidak membuahkan hasil pada pangkalan data keanggotaan aktif.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                      <TableRow>
                        <TableHead className="w-12 text-center text-[11px] font-bold text-slate-400 uppercase">No</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase">Identitas Anggota</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase text-center">Jumlah Rekening</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-400 uppercase text-right">Total Akumulasi Saldo</TableHead>
                        <TableHead className="w-40 text-[11px] font-bold text-slate-400 uppercase text-center">Aksi Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedMembers.map((m, idx) => (
                        <TableRow 
                          key={m.memberId}
                          className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                          onClick={() => {
                            setSelectedMemberDialog({
                              isOpen: true,
                              memberId: m.memberId,
                              namaLengkap: m.namaLengkap,
                              nik: m.nik,
                              anggotaObj: m.anggotaObj,
                              rekeningList: m.rekeningList,
                            });
                          }}
                        >
                          <TableCell className="text-center font-mono text-xs text-slate-400">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                              {m.namaLengkap}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              NIK: {m.nik}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {m.rekeningList.length} Unit
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs text-blue-700">
                            Rp {m.totalSaldo.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 gap-1 shadow-xs rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMemberDialog({
                                  isOpen: true,
                                  memberId: m.memberId,
                                  namaLengkap: m.namaLengkap,
                                  nik: m.nik,
                                  anggotaObj: m.anggotaObj,
                                  rekeningList: m.rekeningList,
                                });
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" /> Lihat Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── JALUR MODE 2: TRANSAKSI OPERASIONAL KANTOR ── */}
      {txMode === "operasional" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-4 flex items-start gap-3 text-purple-900">
            <FileText className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="font-bold">Buku Kas Umum Kantor:</strong> Jalur ini digunakan untuk mencatat pemasukan atau pengeluaran kas yang <span className="underline font-medium">tidak terhubung dengan simpanan anggota</span>. Transaksi akan langsung dikreditkan atau didebetkan pada akun kas utama kasir terhadap akun perkiraan (Coa) pengeluaran/pendapatan operasional yang Anda pilih.
            </div>
          </div>

          {/* Kartu Pemicu Modal Operasional Besar bergaya Premium */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pemicu Kas Masuk */}
            <div 
              onClick={() => openOpModal("masuk")}
              className="group relative bg-white border-2 border-slate-100 hover:border-purple-300 rounded-2xl p-6 cursor-pointer shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between h-48"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full group-hover:scale-110 transition-transform duration-300 z-0" />
              <div className="relative z-10 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Penerimaan Kas Umum</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Catat pemasukan kas dari pendapatan jasa lain, penerimaan non-operasional, atau penyetoran sisa panjar dinas.
                </p>
              </div>
              <div className="relative z-10 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform duration-300">
                <span>Buka Formulir Pemasukan</span>
                <ArrowDownToLine className="w-4 h-4" />
              </div>
            </div>

            {/* Pemicu Kas Keluar */}
            <div 
              onClick={() => openOpModal("keluar")}
              className="group relative bg-white border-2 border-slate-100 hover:border-amber-300 rounded-2xl p-6 cursor-pointer shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between h-48"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full group-hover:scale-110 transition-transform duration-300 z-0" />
              <div className="relative z-10 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                  <Minus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Pengeluaran Kas Umum</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Catat pembayaran biaya rutin kantor seperti listrik, PDAM, pembelian ATK, honorarium, atau panjar kegiatan dinas.
                </p>
              </div>
              <div className="relative z-10 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform duration-300">
                <span>Buka Formulir Pengeluaran</span>
                <ArrowUpFromLine className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL FORMULAR 1: TRANSAKSI ANGGOTA ── */}
      {memberModal.isOpen && memberModal.rekening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-4 text-white flex items-center justify-between ${memberModal.type === "setor" ? "bg-emerald-700" : "bg-rose-700"}`}>
              <div className="flex items-center gap-2">
                {memberModal.type === "setor" ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                <div>
                  <h3 className="text-sm font-bold">
                    Formulir {memberModal.type === "setor" ? "Setoran Simpanan" : "Penarikan Simpanan"}
                  </h3>
                  <p className="text-[10px] text-white/80">Otorisasi Mutasi Buku Besar Kasir</p>
                </div>
              </div>
              <button 
                onClick={() => setMemberModal(prev => ({ ...prev, isOpen: false }))}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitMemberTx} className="p-5 space-y-4">
              {/* Detail Anggota Terkunci */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Identitas Pemilik Rekening</span>
                <div className="text-xs font-bold text-slate-900">
                  {memberModal.rekening.anggota?.namaLengkap}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span className="font-mono">{memberModal.rekening.noRekening}</span>
                  <span>Saldo: Rp {(Number(memberModal.rekening.saldo) || 0).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Pemilihan Metode Pembayaran (SOP Penerimaan VA, QRIS, Tunai) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jalur Pembayaran / Penerimaan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "TUNAI", label: "Kas Tunai" },
                    { id: "QRIS", label: "QRIS" },
                    { id: "VA", label: "Virtual Acc." },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMemberFormData(prev => ({ ...prev, metode: m.id }))}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-bold transition-all ${
                        memberFormData.metode === m.id
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pilihan Lanjutan VA Bank jika dipilih metode Virtual Acc. */}
              {memberFormData.metode === "VA" && (
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <label className="block text-[11px] font-bold text-blue-900">
                    Pilih Bank Tujuan Virtual Account <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "MANDIRI", label: "Bank Mandiri" },
                      { id: "BNI", label: "Bank BNI" },
                      { id: "BRI", label: "Bank BRI" },
                      { id: "BCA", label: "Bank BCA" },
                    ].map((b) => (
                      <label
                        key={b.id}
                        onClick={() => setMemberFormData(prev => ({ ...prev, vaBank: b.id }))}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                          memberFormData.vaBank === b.id
                            ? "bg-white border-blue-600 text-blue-800 font-bold shadow-2xs"
                            : "bg-white/60 border-blue-200/60 text-slate-600 hover:bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="vaBank"
                          checked={memberFormData.vaBank === b.id}
                          onChange={() => {}}
                          className="text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span>{b.label}</span>
                      </label>
                    ))}
                  </div>
                  <span className="text-[10px] text-blue-700 block italic">
                    Sistem akan memanggil API Xendit untuk memfasilitasi integrasi nomor VA spesifik.
                  </span>
                </div>
              )}

              {/* Tampilan Penjelas jika dipilih metode QRIS */}
              {memberFormData.metode === "QRIS" && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 flex items-start gap-2.5 text-indigo-900 animate-in fade-in zoom-in-95 duration-200">
                  <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold">QRIS Dinamis Terintegrasi:</span> Setelah formulir diposting, sistem akan langsung menyajikan *string* dan tautan simulator QRIS. Saldo akan diakreditasi seketika setelah *webhook event* diterima dari Xendit.
                  </div>
                </div>
              )}

              {/* Input Nominal (SOP Font Mono, Kosong Default) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ketik angka tanpa titik..."
                    value={memberFormData.nominal}
                    onChange={(e) => {
                      // Ambil hanya karakter angka murni
                      const cleaned = e.target.value.replace(/\D/g, "");
                      setMemberFormData(prev => ({ ...prev, nominal: cleaned }));
                    }}
                    className="w-full h-11 pl-9 pr-3 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 text-slate-900 placeholder:font-sans placeholder:font-normal"
                  />
                </div>
                <span className="text-[10px] text-blue-700 mt-1 block italic font-semibold">
                  {Number(memberFormData.nominal) > 0 ? `Terbilang: Rp ${Number(memberFormData.nominal).toLocaleString("id-ID")}` : "Wajib diisi nominal yang valid"}
                </span>
              </div>

              {/* Input Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Berita / Uraian</label>
                <textarea
                  rows={2}
                  value={memberFormData.keterangan}
                  onChange={(e) => setMemberFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Keterangan setoran/penarikan..."
                  className="w-full p-2.5 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 text-slate-900 resize-none"
                />
              </div>

              {/* Tombol Eksekusi Berikon */}
              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMemberModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-1/3 text-xs font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 text-xs font-bold text-white shadow-md ${memberModal.type === "setor" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      {memberModal.type === "setor" ? <ArrowDownToLine className="mr-1.5 h-3.5 w-3.5" /> : <ArrowUpFromLine className="mr-1.5 h-3.5 w-3.5" />}
                      Verifikasi & Posting Jurnal
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL FORMULAR 2: TRANSAKSI OPERASIONAL KANTOR ── */}
      {opModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-4 text-white flex items-center justify-between ${opModal.type === "masuk" ? "bg-purple-700" : "bg-amber-600"}`}>
              <div className="flex items-center gap-2">
                {opModal.type === "masuk" ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                <div>
                  <h3 className="text-sm font-bold">
                    Jurnal {opModal.type === "masuk" ? "Penerimaan Kas Umum" : "Pengeluaran Kas Umum"}
                  </h3>
                  <p className="text-[10px] text-white/80">Alokasi Buku Besar Kasir non-Anggota</p>
                </div>
              </div>
              <button 
                onClick={() => setOpModal(prev => ({ ...prev, isOpen: false }))}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitOpTx} className="p-5 space-y-4">
              {/* Pilihan Kategori Pembayaran/Penerimaan (Dropdown Dinamis) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kategori Transaksi Kas <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setKatCrudModal({
                        isOpen: true,
                        mode: "tambah",
                        kode: `KAT-${Date.now().toString().slice(-4)}`,
                        nama: "",
                        jenis: opModal.type === "masuk" ? "MASUK" : "KELUAR",
                        deskripsi: "",
                        coaId: dbOptions.allCoas.find(c => c.tipe === (opModal.type === "masuk" ? "REVENUE" : "EXPENSE"))?.id || dbOptions.allCoas[0]?.id || "",
                      });
                    }}
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Tambah Kategori
                  </button>
                </div>

                <select
                  required
                  value={opFormData.kategori}
                  onChange={(e) => setOpFormData(prev => ({ ...prev, kategori: e.target.value }))}
                  className="w-full h-11 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600 text-slate-900 font-medium bg-white"
                >
                  <option value="">-- Pilih Kategori Transaksi --</option>
                  {dbOptions.kategoriList
                    .filter(k => k.jenis === (opModal.type === "masuk" ? "MASUK" : "KELUAR"))
                    .map((kat) => (
                      <option key={kat.id} value={kat.id}>
                        {kat.nama} {kat.coa ? `[${kat.coa.kodeAkun}]` : ""}
                      </option>
                    ))
                  }
                </select>

                {/* Tampilkan deskripsi & tombol edit/hapus untuk kategori terpilih jika ada */}
                {(() => {
                  const selKat = dbOptions.kategoriList.find(k => k.id === opFormData.kategori);
                  if (!selKat) return null;
                  return (
                    <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-start justify-between gap-2 animate-in fade-in duration-150">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-700">Info Rujukan:</span>
                        <span className="block text-[10px] text-slate-500">
                          {selKat.deskripsi || "Tanpa deskripsi"} — Akun Buku Besar: <strong className="text-slate-800">{selKat.coa?.kodeAkun} ({selKat.coa?.namaAkun})</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setKatCrudModal({
                              isOpen: true,
                              mode: "edit",
                              id: selKat.id,
                              kode: selKat.kode,
                              nama: selKat.nama,
                              jenis: selKat.jenis as any,
                              deskripsi: selKat.deskripsi || "",
                              coaId: selKat.coaId,
                            });
                          }}
                          className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Apakah Anda yakin ingin menghapus kategori "${selKat.nama}"?`)) {
                              setIsLoadingOptions(true);
                              const res = await deleteKategoriAction(selKat.id);
                              if (res.success) {
                                showFeedback("success", "Hapus Kategori Berhasil", "Kategori transaksi berhasil dihapus dari koordinasi sistem.");
                                setOpFormData(prev => ({ ...prev, kategori: "" }));
                                await reloadTellerOptionsData();
                              } else {
                                showFeedback("error", "Gagal Menghapus Kategori", res.error || "Terjadi kesalahan saat menghapus data.");
                                setIsLoadingOptions(false);
                              }
                            }
                          }}
                          className="px-2 py-1 bg-rose-50 border border-rose-100 rounded hover:bg-rose-100 text-[10px] font-bold text-rose-600 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <span className="text-[10px] text-slate-400 mt-1.5 block italic">
                  *Sistem CoA otomatis memetakan transaksi ke pos rujukan buku besar di atas.
                </span>
              </div>


              {/* Input Nominal (SOP Font Mono, Kosong Default) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    required
                    placeholder="Ketik nominal uang bersih..."
                    value={opFormData.nominal}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "");
                      setOpFormData(prev => ({ ...prev, nominal: cleaned }));
                    }}
                    className="w-full h-11 pl-9 pr-3 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600 text-slate-900 placeholder:font-sans placeholder:font-normal"
                  />
                </div>
                <span className="text-[10px] text-purple-700 mt-1 block italic font-semibold">
                  {Number(opFormData.nominal) > 0 ? `Terbilang: Rp ${Number(opFormData.nominal).toLocaleString("id-ID")}` : "Wajib diisi nominal yang valid"}
                </span>
              </div>

              {/* Input Uraian / Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian / Penjelasan Transaksi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={opFormData.keterangan}
                  onChange={(e) => setOpFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Rincian lengkap peruntukan kas..."
                  className="w-full p-2.5 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600 text-slate-900 resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Tombol Eksekusi Berikon */}
              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-1/3 text-xs font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 text-xs font-bold text-white shadow-md ${opModal.type === "masuk" ? "bg-purple-600 hover:bg-purple-700" : "bg-amber-600 hover:bg-amber-700"}`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      {opModal.type === "masuk" ? <Plus className="mr-1.5 h-3.5 w-3.5" /> : <Minus className="mr-1.5 h-3.5 w-3.5" />}
                      Posting Jurnal Umum
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DIALOG DETAIL ANGGOTA & LIST REKENING ── */}
      <Dialog 
        open={selectedMemberDialog.isOpen} 
        onOpenChange={(open) => setSelectedMemberDialog(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-3xl bg-white rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white relative">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-blue-400" />
                Rincian Portofolio Simpanan Anggota
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Pilih unit rekening simpanan di bawah ini untuk memproses Setoran atau Penarikan tunai.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-white">{selectedMemberDialog.namaLengkap}</div>
                <div className="text-[11px] text-slate-300 font-mono">NIK: {selectedMemberDialog.nik || "-"}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 text-right w-max">
                <span className="text-[9px] uppercase tracking-wider block text-slate-300 font-bold">Total Portofolio</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Rp {selectedMemberDialog.rekeningList.reduce((acc, r) => acc + (Number(r.saldo) || 0), 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="border rounded-xl overflow-hidden border-slate-100">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">No. Rekening</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Produk / Kategori</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase text-right">Saldo Aktual</TableHead>
                    <TableHead className="w-48 text-[11px] font-bold text-slate-500 uppercase text-center">Otorisasi Kasir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMemberDialog.rekeningList.map((rek) => {
                    const saldoVal = Number(rek.saldo) || 0;
                    const jenisProduk = rek.produk?.jenis || "";
                    const isUnwithdrawable = jenisProduk === "POKOK" || jenisProduk === "WAJIB";
                    // Simpanan Pokok cukup disetor satu kali di awal pendaftaran
                    const isPokokAlreadyPaid = jenisProduk === "POKOK" && saldoVal > 0;

                    return (
                      <TableRow key={rek.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono font-bold text-xs text-slate-700">
                          {rek.noRekening}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-xs text-slate-900">
                            {rek.produk?.namaProduk || "Simpanan Koperasi"}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            Jenis: {jenisProduk || "SUKARELA"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs text-blue-700">
                          Rp {saldoVal.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            {isPokokAlreadyPaid ? (
                              <div className="relative group/btn">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled
                                  className="h-8 bg-slate-100 text-slate-400 text-[11px] font-bold px-2.5 rounded-md flex items-center gap-1 opacity-60 cursor-not-allowed"
                                >
                                  <ArrowDownToLine className="w-3.5 h-3.5" /> Setor
                                </Button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/btn:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl w-48 text-center z-50 pointer-events-none leading-tight">
                                  Simpanan Pokok hanya perlu disetor satu kali pada awal pendaftaran.
                                </div>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 rounded-md flex items-center gap-1"
                                onClick={() => {
                                  setSelectedMemberDialog(prev => ({ ...prev, isOpen: false }));
                                  openMemberModal(rek, "setor");
                                }}
                              >
                                <ArrowDownToLine className="w-3.5 h-3.5" /> Setor
                              </Button>
                            )}

                            {isUnwithdrawable ? (
                              <div className="relative group/btn">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled
                                  className="h-8 bg-slate-100 text-slate-400 text-[11px] font-bold px-2.5 rounded-md flex items-center gap-1 opacity-60 cursor-not-allowed"
                                >
                                  <ArrowUpFromLine className="w-3.5 h-3.5" /> Tarik
                                </Button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/btn:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl w-48 text-center z-50 pointer-events-none leading-tight">
                                  Simpanan {jenisProduk} tidak boleh ditarik kecuali anggota mengundurkan diri.
                                </div>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2.5 rounded-md flex items-center gap-1"
                                onClick={() => {
                                  setSelectedMemberDialog(prev => ({ ...prev, isOpen: false }));
                                  openMemberModal(rek, "tarik");
                                }}
                              >
                                <ArrowUpFromLine className="w-3.5 h-3.5" /> Tarik
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Catatan / Rekomendasi Sistem */}
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 flex items-start gap-2.5 text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">Panduan Keamanan Transaksi:</span> Tombol aksi diletakkan langsung per baris rekening untuk menghindari salah penempatan setoran/penarikan oleh kasir. Sistem secara cerdas mengunci penarikan pada akun Simpanan Pokok dan Wajib demi kepatuhan terhadap prinsip akuntansi koperasi.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL DIALOG INVOICE XENDIT PAYMENT GATEWAY ── */}
      <Dialog 
        open={xenditInvoiceDialog.isOpen} 
        onOpenChange={(open) => setXenditInvoiceDialog(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-md bg-white rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white text-center">
            <Building2 className="w-10 h-10 text-blue-200 mx-auto mb-2 animate-bounce" />
            <DialogTitle className="text-base font-extrabold text-white">
              Tagihan Pembayaran Terhubung Xendit
            </DialogTitle>
            <DialogDescription className="text-xs text-blue-100 mt-1">
              ID Eksternal: <span className="font-mono font-bold text-white">{xenditInvoiceDialog.externalId}</span>
            </DialogDescription>
          </div>

          <div className="p-5 space-y-4">
            {/* Box Rincian Nominal */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tagihan Bersih</span>
              <span className="text-xl font-mono font-extrabold text-blue-700 block mt-0.5">
                Rp {xenditInvoiceDialog.nominal.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Konten Tergantung Jalur VA / QRIS */}
            {xenditInvoiceDialog.metode === "VA" ? (
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Nomor Virtual Account (VA)</span>
                  <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-lg p-2.5">
                    <span className="font-mono font-bold text-sm tracking-widest text-blue-900">
                      {xenditInvoiceDialog.vaNumber || "8808-XXXX-XXXX"}
                    </span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {xenditInvoiceDialog.bankName || "Mandiri/BNI"}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  Gunakan simulator pembayaran pada dasbor Sandbox Xendit Anda untuk menyetorkan dana ke VA di atas. Sistem akan memproses notifikasi secara instan.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <span className="text-xs font-bold text-slate-700 block">Pindai Kode QRIS Standar</span>
                <div className="w-40 h-40 bg-slate-100 border-2 border-slate-200 rounded-xl mx-auto flex flex-col items-center justify-center p-2 relative group">
                  <div className="text-[10px] font-mono text-slate-400 break-all line-clamp-5 text-center">
                    {xenditInvoiceDialog.qrisString}
                  </div>
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center font-bold text-xs text-slate-700 p-2 text-center rounded-xl">
                    [Simulasi QRIS Xendit Sandbox]
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Payload QRIS dinamis berhasil dihasilkan. *Webhook* akan bertindak selaku pemicu akhir penambahan saldo pembukuan.
                </p>
              </div>
            )}

            {/* Aksi Simulator & Penutupan */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              {xenditInvoiceDialog.invoiceUrl && (
                <a
                  href={xenditInvoiceDialog.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  Buka Laman Checkout Simulator <ChevronRight className="w-4 h-4" />
                </a>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full h-9 text-xs font-bold"
                onClick={() => setXenditInvoiceDialog(prev => ({ ...prev, isOpen: false }))}
              >
                Tutup Jendela Tagihan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL DIALOG PENGELOLAAN KATEGORI TRANSAKSI KUSTOM (CRUD) ── */}
      <Dialog
        open={katCrudModal.isOpen}
        onOpenChange={(open) => setKatCrudModal(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-md bg-white rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
          <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-4 text-white flex items-center justify-between pr-10">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-200" />
              <div>
                <DialogTitle className="text-sm font-bold text-white">
                  {katCrudModal.mode === "tambah" ? "Tambah Kategori Baru" : "Edit Kategori Transaksi"}
                </DialogTitle>
                <DialogDescription className="text-[10px] text-purple-100 mt-0.5">
                  Pengaturan pos pembukuan & rujukan CoA di belakang layar
                </DialogDescription>
              </div>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsKatSaving(true);
              try {
                const payload = {
                  id: katCrudModal.id,
                  koperasiId: dbOptions.koperasiId,
                  kode: katCrudModal.kode.trim(),
                  nama: katCrudModal.nama.trim(),
                  jenis: katCrudModal.jenis,
                  deskripsi: katCrudModal.deskripsi.trim(),
                  coaId: katCrudModal.coaId,
                };

                const res = await saveKategoriAction(payload);
                if (res.success) {
                  showFeedback(
                    "success",
                    katCrudModal.mode === "tambah" ? "Kategori Baru Berhasil Dibuat" : "Kategori Berhasil Diperbarui",
                    `Kategori transaksi "${payload.nama}" berhasil diintegrasikan dengan kode rujukan [${payload.kode}] ke dalam PostgreSQL.`
                  );
                  setKatCrudModal(prev => ({ ...prev, isOpen: false }));
                  // Setel sebagai terpilih
                  await reloadTellerOptionsData();
                  // Jika tambah baru, cari item baru pasca muat ulang untuk otomatis dpilih
                } else {
                  showFeedback("error", "Gagal Menyimpan Kategori", res.error || "Terjadi galat sistem saat pencatatan konfigurasi.");
                }
              } catch (err: any) {
                showFeedback("error", "Kesalahan Sistem", err.message || "Gagal menghubungi peladen.");
              } finally {
                setIsKatSaving(false);
              }
            }}
            className="p-5 space-y-3.5"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sandi Kode Unik <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Misal: KAT-01, OP-LISTRIK"
                value={katCrudModal.kode}
                onChange={(e) => setKatCrudModal(prev => ({ ...prev, kode: e.target.value.toUpperCase() }))}
                className="w-full h-10 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600 text-slate-900 bg-white"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">Sandi kode identifikasi singkat di pangkalan data.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Kategori Transaksi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Misal: Tagihan Listrik & Air"
                value={katCrudModal.nama}
                onChange={(e) => setKatCrudModal(prev => ({ ...prev, nama: e.target.value }))}
                className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600 text-slate-900 font-medium bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Arus Kas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={katCrudModal.jenis}
                  onChange={(e) => setKatCrudModal(prev => ({ ...prev, jenis: e.target.value as any }))}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600 text-slate-900 font-medium bg-white"
                >
                  <option value="MASUK">KAS MASUK</option>
                  <option value="KELUAR">KAS KELUAR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Akun Rujukan (CoA) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={katCrudModal.coaId}
                  onChange={(e) => setKatCrudModal(prev => ({ ...prev, coaId: e.target.value }))}
                  className="w-full h-10 px-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600 text-slate-900 font-medium bg-white"
                >
                  <option value="">-- Pilih CoA Lawan --</option>
                  {dbOptions.allCoas
                    .filter(c => katCrudModal.jenis === "MASUK" ? c.tipe === "REVENUE" || c.tipe === "LIABILITY" : c.tipe === "EXPENSE" || c.tipe === "ASSET")
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        [{c.kodeAkun}] {c.namaAkun}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi Singkat / Panduan Teller
              </label>
              <textarea
                rows={2}
                placeholder="Penjelasan ringkas bagi teller kapan kategori ini digunakan..."
                value={katCrudModal.deskripsi}
                onChange={(e) => setKatCrudModal(prev => ({ ...prev, deskripsi: e.target.value }))}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600 text-slate-900 bg-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setKatCrudModal(prev => ({ ...prev, isOpen: false }))}
                className="h-8 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isKatSaving}
                className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
              >
                {isKatSaving ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Simpan Konfigurasi"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── FEEDBACK MODAL GLOBAL (SOP Compliance) ── */}
      <FeedbackModal
        isOpen={feedbackState.isOpen}
        onClose={() => setFeedbackState(prev => ({ ...prev, isOpen: false }))}
        type={feedbackState.type}
        title={feedbackState.title}
        description={feedbackState.description}
      />
    </div>
  );
}
