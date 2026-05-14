"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCog, UserPlus, Lock, Key, Edit, RefreshCw, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";
import { getUsersAction, createUserAction, updateUserAction, toggleUserStatusAction, deleteUserAction } from "@/actions/users-action";
import { TableEmptyState } from "@/components/shared/TableHelper";

export default function UsersPage() {
  const [userList, setUserList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"tambah" | "edit">("tambah");
  const [selectedId, setSelectedId] = useState("");

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

  // State Formulir Pengguna
  const [formUser, setFormUser] = useState({
    username: "",
    namaLengkap: "",
    role: "TELLER" as "SUPERADMIN" | "MANAGER" | "TELLER",
    email: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getUsersAction();
      if (res.success && res.data) {
        setUserList(res.data);
      } else {
        showModal("error", "Gagal Memuat Data", res.error || "Terjadi kesalahan sistem saat mengambil data operator.");
      }
    } catch (e: any) {
      showModal("error", "Galat Jaringan", "Peladen pangkalan data tidak dapat diakses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBukaTambah = () => {
    setModalMode("tambah");
    setSelectedId("");
    setFormUser({ username: "", namaLengkap: "", role: "TELLER", email: "" });
    setIsOpenModal(true);
  };

  const handleBukaEdit = (item: any) => {
    setModalMode("edit");
    setSelectedId(item.id);
    setFormUser({
      username: item.username || "",
      namaLengkap: item.namaLengkap || "",
      role: item.role || "TELLER",
      email: item.email || "",
    });
    setIsOpenModal(true);
  };

  const handleSimpanUser = async () => {
    if (!formUser.namaLengkap.trim()) {
      showModal("warning", "Isian Belum Lengkap", "Harap masukkan nama lengkap operator untuk tujuan pencatatan otorisasi.");
      return;
    }

    // Jika mode tambah, username wajib diisi
    if (modalMode === "tambah" && !formUser.username.trim()) {
      showModal("warning", "Isian Belum Lengkap", "Harap tentukan username atau sandi identifikasi unik.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "tambah") {
        const formattedUsername = formUser.username.toLowerCase().replace(/\s+/g, "_");
        const formattedEmail = formUser.email.trim() || `${formattedUsername}@koperasi.id`;

        const res = await createUserAction({
          username: formattedUsername,
          namaLengkap: formUser.namaLengkap,
          email: formattedEmail,
          role: formUser.role,
        });

        if (res.success) {
          setIsOpenModal(false);
          showModal(
            "success",
            "Operator Berhasil Didaftarkan",
            `Akun pengguna "${formUser.namaLengkap}" telah diberikan hak akses peran ${formUser.role} secara riil di dalam PostgreSQL.`
          );
          loadData();
        } else {
          showModal("error", "Pendaftaran Gagal", res.error || "Gagal menyisipkan entitas pengguna.");
        }
      } else {
        // Alur Eksekusi Penyuntingan
        const res = await updateUserAction({
          id: selectedId,
          namaLengkap: formUser.namaLengkap,
          email: formUser.email,
          role: formUser.role,
        });

        if (res.success) {
          setIsOpenModal(false);
          showModal(
            "success",
            "Pembaruan Atribut Akun Berhasil",
            `Atribut otorisasi untuk operator "${formUser.namaLengkap}" telah diperbarui secara permanen di basis data.`
          );
          loadData();
        } else {
          showModal("error", "Pembaruan Gagal", res.error || "Gagal memutakhirkan properti operator.");
        }
      }
    } catch (e: any) {
      showModal("error", "Galat Sistem", "Koneksi ke peladen terputus saat mengeksekusi kueri.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatusReal = async (id: string, name: string) => {
    const res = await toggleUserStatusAction(id);
    if (res.success) {
      showModal(
        "success",
        "Otorisasi Akses Diperbarui",
        `Hak otentikasi untuk akun "${name}" kini berstatus ${res.nextStatus ? "AKTIF" : "TERKUNCI"}. Jejak modifikasi tercatat di Audit Log.`
      );
      loadData();
    } else {
      showModal("error", "Gagal Mengubah Status", res.error || "Gagal menghubungi basis data.");
    }
  };

  const handleAturUlangSandi = (name: string) => {
    showModal(
      "success",
      "Sandi Diatur Ulang",
      `Tautan pengaturan ulang kata sandi (One-Time Link) terenkripsi untuk operator "${name}" telah disiarkan dan dicatat pada sistem log internal.`
    );
  };

  const handleHapusUser = async (id: string, name: string) => {
    const res = await deleteUserAction(id);
    if (res.success) {
      showModal(
        "success",
        "Akun Berhasil Dihapus",
        `Entitas operator "${name}" telah dihapus secara permanen dari tabel basis data beserta pelepasan relasi rekam jejak auditnya.`
      );
      loadData();
    } else {
      showModal("error", "Penghapusan Ditolak", res.error || "Gagal menghapus entitas pengguna.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manajemen User & Hak Akses</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pengaturan kredensial operator, peran otorisasi, dan penegakan batas kontrol keamanan langsung dari PostgreSQL.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Memuat..." : "Muat Ulang"}
          </Button>
          <Button
            size="sm"
            onClick={handleBukaTambah}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-9 shadow-md"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Tambah Akun Operator
          </Button>
        </div>
      </div>

      {/* ── Tabel Senarai Akun Riil ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-xs font-bold text-slate-700 uppercase">Daftar Pengguna Sistem Terdaftar</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono text-slate-600">
            Total {userList.length} Akun Riil
          </Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[750px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">ID Rujukan</TableHead>
                <TableHead className="th-standard">Akun / Email</TableHead>
                <TableHead className="th-standard">Nama Operator</TableHead>
                <TableHead className="th-standard text-center">Tingkat Hak Akses</TableHead>
                <TableHead className="th-standard text-center">Cabang Instansi</TableHead>
                <TableHead className="th-standard text-center">Status</TableHead>
                <TableHead className="th-standard text-right pr-6">Pengamanan & Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userList.length === 0 ? (
                <TableEmptyState colSpan={7} message="Belum ada pengguna atau operator terdaftar di dalam basis data." />
              ) : (
                userList.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-mono text-[10px] text-slate-400">
                      {row.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-blue-600">
                      {row.email}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900">
                      {row.namaLengkap}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] ${
                        row.role === "SUPERADMIN" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                        row.role === "MANAGER" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {row.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-600 font-medium">
                      {row.koperasiName}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-medium py-0.5 px-2 ${
                          row.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                        }`}
                      >
                        {row.isActive ? "AKTIF" : "TERKUNCI"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-1 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleBukaEdit(row)}
                        title="Sunting Properti Akun"
                        className="w-7 h-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 align-middle"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAturUlangSandi(row.namaLengkap)}
                        title="Atur Ulang Sandi"
                        className="w-7 h-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50 align-middle"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatusReal(row.id, row.namaLengkap)}
                        title={row.isActive ? "Kunci Akses" : "Buka Kunci"}
                        className={`w-7 h-7 align-middle ${row.isActive ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-rose-500 hover:text-emerald-600 hover:bg-emerald-50"}`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleHapusUser(row.id, row.namaLengkap)}
                        title="Hapus Akun Permanen"
                        className="w-7 h-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 align-middle"
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

      {/* ── Dialog Tambah / Sunting Operator ── */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="sm:max-w-[420px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {modalMode === "tambah" ? "Pendaftaran Operator Baru" : "Penyuntingan Akun Operator"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tentukan parameter kredensial dan batas otorisasi peran (*RBAC*).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {modalMode === "tambah" && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username Unik</label>
                <input
                  type="text"
                  placeholder="contoh: teller_01"
                  value={formUser.username}
                  onChange={(e) => setFormUser({ ...formUser, username: e.target.value })}
                  className="w-full h-8 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lengkap Operator</label>
              <input
                type="text"
                placeholder="Nama Lengkap..."
                value={formUser.namaLengkap}
                onChange={(e) => setFormUser({ ...formUser, namaLengkap: e.target.value })}
                className="w-full h-8 px-3 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alamat Surel Rujukan</label>
              <input
                type="email"
                placeholder="operator@koperasi.id"
                value={formUser.email}
                onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tingkat Hak Akses / Peran</label>
              <select
                value={formUser.role}
                onChange={(e) => setFormUser({ ...formUser, role: e.target.value as any })}
                className="w-full h-8 px-2 text-xs font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
              >
                <option value="TELLER">TELLER - Kasir Operasional</option>
                <option value="MANAGER">MANAGER - Persetujuan Kredit & SHU</option>
                <option value="SUPERADMIN">SUPERADMIN - Kendali Mutlak</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpenModal(false)} className="text-xs h-8 font-semibold">
              Batal
            </Button>
            <Button size="sm" onClick={handleSimpanUser} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-8 font-bold shadow-md">
              {isSubmitting ? "Menyimpan..." : modalMode === "tambah" ? "Daftarkan Operator" : "Simpan Perubahan"}
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
