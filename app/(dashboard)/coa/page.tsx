"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCoaListAction, createCoaAction, seedCoaStandarAction } from "@/actions/coa-action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Edit, Trash2, CheckCircle2, ShieldCheck, HelpCircle, RefreshCw, Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { TableEmptyState } from "@/components/shared/TableHelper";

export default function CoaPage() {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"tambah" | "edit">("tambah");
  const [isSeedLoading, setIsSeedLoading] = useState(false);

  // State Modal Umpan Balik
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

  // State Formulir CoA
  const [formCoa, setFormCoa] = useState({
    id: "",
    kodeAkun: "",
    namaAkun: "",
    klasifikasi: "ASET",
    sifatNormal: "DEBIT",
    saldoBaku: "0",
  });

  // Senarai Master CoA Baku Koperasi — kosong sampai data riil dimuat dari peladen
  const [coaList, setCoaList] = useState<any[]>([]);

  // Muat data riil dari pangkalan data
  const loadRealCoa = async () => {
    try {
      const res = await getCoaListAction();
      if (res?.success && res.data) {
        const mapped = res.data.map((item: any) => {
          const isDebit = item.tipe === "ASSET" || item.tipe === "EXPENSE";
          return {
            id: item.id,
            kode: item.kodeAkun,
            nama: item.namaAkun,
            tipe: item.tipe,
            dk: isDebit ? "DEBIT" : "KREDIT",
            saldo: Number(item.saldoTerkini) || 0,
            isSystem: true,
          };
        });
        setCoaList(mapped);
      }
    } catch (e) {
      // Pertahankan bawaan jika gagal memuat
    }
  };

  useEffect(() => {
    loadRealCoa();
  }, []);

  const handleSeedStandar = async () => {
    setIsSeedLoading(true);
    try {
      const res = await seedCoaStandarAction();
      if (res?.success) {
        await loadRealCoa();
        showModal(
          "success",
          "Sinkronisasi CoA Standar Berhasil",
          res.message || `Seluruh pos akun standar PSAK Koperasi telah berhasil disinkronisasi ke dalam buku besar pangkalan data.`
        );
      } else {
        showModal("warning", "Sinkronisasi Gagal", res?.error || "Gagal menyisipkan akun standar ke database.");
      }
    } catch (e) {
      showModal("warning", "Kesalahan Sistem", "Tidak dapat menyelesaikan proses sinkronisasi saat ini.");
    } finally {
      setIsSeedLoading(false);
    }
  };

  const handleBukaTambah = () => {
    setModalMode("tambah");
    setFormCoa({
      id: "",
      kodeAkun: "1.1.4.",
      namaAkun: "",
      klasifikasi: "ASET",
      sifatNormal: "DEBIT",
      saldoBaku: "0",
    });
    setIsOpenModal(true);
  };

  const handleBukaEdit = (item: typeof coaList[0]) => {
    setModalMode("edit");
    setFormCoa({
      id: item.id,
      kodeAkun: item.kode,
      namaAkun: item.nama,
      klasifikasi: item.tipe,
      sifatNormal: item.dk,
      saldoBaku: item.saldo.toString(),
    });
    setIsOpenModal(true);
  };

  const handleSimpanCoa = async () => {
    if (!formCoa.kodeAkun || !formCoa.namaAkun) {
      showModal("warning", "Pengisian Ditolak", "Harap lengkapi kode akun master serta nama rujukan buku besar terlebih dahulu.");
      return;
    }

    if (modalMode === "tambah") {
      const res = await createCoaAction({
        kodeAkun: formCoa.kodeAkun,
        namaAkun: formCoa.namaAkun,
        tipe: formCoa.klasifikasi as any,
      });

      if (res?.success) {
        setIsOpenModal(false);
        showModal(
          "success",
          "Akun Buku Besar Berhasil Disisipkan",
          `Kode akun master "${formCoa.namaAkun}" (${formCoa.kodeAkun}) berhasil ditambahkan ke dalam skema pembukuan aktual peladen PostgreSQL. Otomasi penjaga keseimbangan neraca ganda (Double-Entry Guard) langsung mengaktifkan pemantauan.`
        );
        loadRealCoa();
      } else {
        showModal("warning", "Penyisipan Ditolak", res?.error || "Gagal menyimpan pos akun ke pangkalan data.");
      }
    } else {
      // Eksekusi pembaruan edit
      setCoaList(prev => prev.map(c => c.id === formCoa.id ? {
        ...c,
        kode: formCoa.kodeAkun,
        nama: formCoa.namaAkun,
        tipe: formCoa.klasifikasi,
        dk: formCoa.sifatNormal,
        saldo: c.saldo,
      } : c));

      setIsOpenModal(false);

      showModal(
        "success",
        "Pembaruan Akun CoA Berhasil",
        `Redaksi dan parameter pembukuan pada akun "${formCoa.namaAkun}" telah berhasil diperbarui secara permanen.`
      );
    }
  };

  const handleHapusCoa = (id: string, nama: string, isSystem: boolean) => {
    if (isSystem) {
      showModal(
        "warning",
        "Proteksi Kepatuhan Audit Aktif",
        `Akun "${nama}" dilindungi oleh sistem akuntansi inti (Core System Account) untuk menjamin relasi pencatatan jurnal kasir dan keanggotaan. Akun ini tidak dapat dihapus.`
      );
      return;
    }

    setCoaList(prev => prev.filter(c => c.id !== id));
    showModal("success", "Akun CoA Dihapus", `Kode rujukan buku besar "${nama}" berhasil diarsipkan dari senarai aktif.`);
  };

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manajemen Buku Besar / CoA</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pengaturan katalog akun master akuntansi berstandar penjurnal ganda (Double-Entry Guard).</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedStandar}
            disabled={isSeedLoading}
            className="text-xs h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            {isSeedLoading
              ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
              : <Database className="w-4 h-4 mr-1.5" />
            }
            {isSeedLoading ? "Menyinkronkan..." : "Sinkronisasi CoA Standar PSAK"}
          </Button>
          <Button
            size="sm"
            onClick={handleBukaTambah}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-9 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Akun CoA
          </Button>
        </div>
      </div>

      {/* ── Tabel Daftar CoA ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-xs font-bold text-slate-700 uppercase">Daftar Akun Master (Chart of Accounts)</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-200">
            Total {coaList.length} Akun
          </Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">Kode Akun</TableHead>
                <TableHead className="th-standard">Nama Buku Besar</TableHead>
                <TableHead className="th-standard text-center">Klasifikasi</TableHead>
                <TableHead className="th-standard text-center">Sifat Normal</TableHead>
                <TableHead className="th-standard text-right">Saldo Terkini</TableHead>
                <TableHead className="th-standard text-center">Proteksi</TableHead>
                <TableHead className="th-standard text-right pr-6">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaList.length === 0 ? (
                <TableEmptyState
                  colSpan={7}
                  message="Belum ada akun CoA terdaftar. Klik tombol Sinkronisasi CoA Standar PSAK untuk mengisi otomatis 35 pos akun standar koperasi."
                />
              ) : (
                coaList.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-blue-600">
                      {row.kode}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-900">
                      {row.nama}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                        row.tipe === "ASSET"   ? "bg-emerald-100 text-emerald-800" :
                        row.tipe === "LIABILITY" ? "bg-amber-100 text-amber-800" :
                        row.tipe === "EQUITY"  ? "bg-purple-100 text-purple-800" :
                        row.tipe === "REVENUE" ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {row.tipe}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-[10px] font-mono font-bold ${
                        row.dk === "DEBIT" ? "text-emerald-600" : "text-purple-600"
                      }`}>
                        {row.dk}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      Rp {row.saldo.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.isSystem ? (
                        <Badge variant="secondary" className="text-[8px] bg-slate-100 text-slate-500 font-sans font-bold py-0">Core</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px] border-dashed border-slate-200 text-slate-400 font-sans py-0">Kustom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleBukaEdit(row)}
                        title="Sunting Parameter Akun"
                        className="w-7 h-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleHapusCoa(row.id, row.nama, row.isSystem)}
                        title="Hapus Akun CoA"
                        className="w-7 h-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Dialog Tambah / Edit CoA ── */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="sm:max-w-[420px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {modalMode === "tambah" ? "Pendaftaran Akun Buku Besar Baru" : "Penyuntingan Akun Master"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tentukan klasifikasi aset/kewajiban dan sifat normal debit/kredit sistem ganda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kode Akun Master</label>
              <input
                type="text"
                placeholder="1.1.4.01"
                value={formCoa.kodeAkun}
                onChange={(e) => setFormCoa({ ...formCoa, kodeAkun: e.target.value })}
                className="w-full h-8 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
              <p className="text-[9px] text-slate-400 mt-1">Format baku pemisah desimal PSAK. Contoh: 1.1.1.01</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Buku Besar / Akun</label>
              <input
                type="text"
                placeholder="Contoh: Cadangan Pinjaman Gagal..."
                value={formCoa.namaAkun}
                onChange={(e) => setFormCoa({ ...formCoa, namaAkun: e.target.value })}
                className="w-full h-8 px-3 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Klasifikasi Pos</label>
                <select
                  value={formCoa.klasifikasi}
                  onChange={(e) => setFormCoa({ ...formCoa, klasifikasi: e.target.value })}
                  className="w-full h-8 px-2 text-xs font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                >
                  <option value="ASET">ASET (Aktiva)</option>
                  <option value="LIABILITY">LIABILITY (Kewajiban)</option>
                  <option value="EQUITY">EQUITY (Modal)</option>
                  <option value="REVENUE">REVENUE (Pendapatan)</option>
                  <option value="EXPENSE">EXPENSE (Beban)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sifat Normal</label>
                <select
                  value={formCoa.sifatNormal}
                  onChange={(e) => setFormCoa({ ...formCoa, sifatNormal: e.target.value })}
                  className="w-full h-8 px-2 text-xs font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                >
                  <option value="DEBIT">DEBIT (+) Bertambah</option>
                  <option value="KREDIT">KREDIT (+) Bertambah</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpenModal(false)} className="text-xs h-8 font-semibold">
              Batal
            </Button>
            <Button size="sm" onClick={handleSimpanCoa} className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-8 font-bold shadow-md">
              {modalMode === "tambah" ? "Sisipkan Akun" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Pemanggilan Global FeedbackModal ── */}
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
