"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCog, ShieldAlert, CheckCircle2, UserPlus, Lock, Key, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FeedbackModal, FeedbackType } from "@/components/shared/FeedbackModal";

export default function UsersPage() {
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
    role: "TELLER",
    email: "",
  });

  // Senarai Pengguna
  const [userList, setUserList] = useState([
    { id: "USR-001", username: "admin_master", name: "Rangga Perdana", role: "SUPERADMIN", email: "rangga@koperasi.id", status: "AKTIF", lastActive: "Baru saja" },
    { id: "USR-002", username: "manajer_shu", name: "Siska Dewi", role: "MANAGER", email: "siska@koperasi.id", status: "AKTIF", lastActive: "12 Mei 2026, 14:10" },
    { id: "USR-003", username: "teller_pusat", name: "Bagus Setiawan", role: "TELLER", email: "bagus@koperasi.id", status: "AKTIF", lastActive: "12 Mei 2026, 15:02" },
    { id: "USR-004", username: "audit_eksternal", name: "KAP Tanuwijaya", role: "AUDITOR", email: "audit@tanuwijaya.com", status: "TERKUNCI", lastActive: "01 Mei 2026, 09:00" },
  ]);

  const handleBukaTambah = () => {
    setModalMode("tambah");
    setSelectedId("");
    setFormUser({ username: "", namaLengkap: "", role: "TELLER", email: "" });
    setIsOpenModal(true);
  };

  const handleBukaEdit = (item: typeof userList[0]) => {
    setModalMode("edit");
    setSelectedId(item.id);
    setFormUser({
      username: item.username,
      namaLengkap: item.name,
      role: item.role,
      email: item.email,
    });
    setIsOpenModal(true);
  };

  const handleSimpanUser = () => {
    if (!formUser.username || !formUser.namaLengkap) {
      showModal("warning", "Isian Belum Lengkap", "Harap masukkan username identitas dan nama lengkap operator.");
      return;
    }

    const formattedUsername = formUser.username.toLowerCase().replace(/\s+/g, "_");
    const formattedEmail = formUser.email || `${formattedUsername}@koperasi.id`;

    if (modalMode === "tambah") {
      // Cek duplikasi username
      const exists = userList.find(u => u.username === formattedUsername);
      if (exists) {
        showModal("warning", "Duplikasi Username", `Username sandi "${formattedUsername}" telah terdaftar pada operator lain. Harap gunakan nama rujukan yang unik.`);
        return;
      }

      const newUser = {
        id: `USR-00${userList.length + 1}`,
        username: formattedUsername,
        name: formUser.namaLengkap,
        role: formUser.role,
        email: formattedEmail,
        status: "AKTIF",
        lastActive: "Belum login",
      };

      setUserList([newUser, ...userList]);
      setIsOpenModal(false);

      showModal(
        "success",
        "Operator Berhasil Didaftarkan",
        `Akun pengguna dengan nama sandi "${newUser.username}" telah diberikan akses peran ${newUser.role} pada tingkat arsitektur. Kredensial sementara dienkripsi otomatis.`
      );
    } else {
      // Alur Eksekusi Penyuntingan
      setUserList(prev => prev.map(u => u.id === selectedId ? {
        ...u,
        username: formattedUsername,
        name: formUser.namaLengkap,
        role: formUser.role,
        email: formattedEmail,
      } : u));

      setIsOpenModal(false);

      showModal(
        "success",
        "Pembaruan Atribut Akun Berhasil",
        `Redaksi nama, surel rujukan, serta hierarki akses untuk operator "${formUser.namaLengkap}" telah dimutakhirkan ke dalam basis data keamanan.`
      );
    }
  };

  const handleToggleStatus = (id: string, name: string, currentStatus: string) => {
    const nextStatus = currentStatus === "AKTIF" ? "TERKUNCI" : "AKTIF";
    setUserList(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u));
    showModal(
      "success",
      `Otorisasi Diperbarui`,
      `Hak akses untuk operator "${name}" kini berstatus ${nextStatus}. Jejak keamanan telah dicatat ke audit log.`
    );
  };

  const handleAturUlangSandi = (name: string) => {
    showModal(
      "success",
      "Sandi Diatur Ulang",
      `Tautan pengaturan ulang kata sandi (One-Time Link) untuk "${name}" telah disiarkan ke surel terdaftar dan salinannya tersedia di laci pesan internal.`
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manajemen User & Hak Akses</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pengaturan kredensial operator, peran otorisasi, dan penegakan batas kontrol keamanan.</p>
        </div>
        <Button
          size="sm"
          onClick={handleBukaTambah}
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-9 shadow-md"
        >
          <UserPlus className="w-4 h-4 mr-1.5" /> Tambah Akun Operator
        </Button>
      </div>

      {/* ── Tabel Senarai Akun ── */}
      <Card className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in duration-200">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-xs font-bold text-slate-700 uppercase">Daftar Pengguna Sistem Terdaftar</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono text-slate-600">
            Total {userList.length} Akun
          </Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto max-w-full">
          <Table className="min-w-[750px]">
            <TableHeader>
              <TableRow>
                <TableHead className="th-standard pl-6">ID</TableHead>
                <TableHead className="th-standard">Akun / Username</TableHead>
                <TableHead className="th-standard">Nama Operator</TableHead>
                <TableHead className="th-standard text-center">Tingkat Hak Akses</TableHead>
                <TableHead className="th-standard text-center">Aktivitas Terakhir</TableHead>
                <TableHead className="th-standard text-center">Status</TableHead>
                <TableHead className="th-standard text-right pr-6">Pengamanan & Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userList.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50">
                  <TableCell className="pl-6 font-mono text-xs font-bold text-slate-600">
                    {row.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-blue-600">
                    {row.username}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">
                    <div>{row.name}</div>
                    <div className="text-[9px] text-slate-400 font-normal">{row.email}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] ${
                      row.role === "SUPERADMIN" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                      row.role === "MANAGER" ? "bg-blue-100 text-blue-700" :
                      row.role === "AUDITOR" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      {row.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-xs text-slate-500 font-medium">
                    {row.lastActive}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-medium py-0.5 px-2 ${
                        row.status === "AKTIF" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleBukaEdit(row)}
                      title="Sunting Properti Akun"
                      className="w-7 h-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAturUlangSandi(row.name)}
                      title="Atur Ulang Sandi"
                      className="w-7 h-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(row.id, row.name, row.status)}
                      title={row.status === "AKTIF" ? "Kunci Akses" : "Buka Kunci"}
                      className={`w-7 h-7 ${row.status === "AKTIF" ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-rose-500 hover:text-emerald-600 hover:bg-emerald-50"}`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
                onChange={(e) => setFormUser({ ...formUser, role: e.target.value })}
                className="w-full h-8 px-2 text-xs font-bold rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
              >
                <option value="TELLER">TELLER - Kasir Operasional</option>
                <option value="MANAGER">MANAGER - Persetujuan Kredit & SHU</option>
                <option value="AUDITOR">AUDITOR - Hanya Baca Laporan/Log</option>
                <option value="SUPERADMIN">SUPERADMIN - Kendali Mutlak</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpenModal(false)} className="text-xs h-8 font-semibold">
              Batal
            </Button>
            <Button size="sm" onClick={handleSimpanUser} className="bg-blue-600 hover:bg-blue-700 text-xs text-white h-8 font-bold shadow-md">
              {modalMode === "tambah" ? "Daftarkan Operator" : "Simpan Perubahan"}
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
