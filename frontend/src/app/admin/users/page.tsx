"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User, Role } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Pencil, Trash2, UserPlus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.users.getAll();
      setUsers(response.data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(id: number) {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (userToDelete === null) return;
    try {
      await api.users.delete(userToDelete);
      loadUsers();
    } catch {
      // Error handled silently
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona los accesos y roles del sistema.</p>
        </div>
        <Link href="/admin/users/new">
          <Button className="cursor-pointer shrink-0">
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6 p-0 overflow-hidden rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-destructive">
                      <AlertCircle className="w-8 h-8" />
                      <p className="text-sm font-medium">Error al cargar datos</p>
                      <p className="text-xs text-muted-foreground">{error}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="w-8 h-8" />
                      <p className="text-sm font-medium">No hay usuarios registrados</p>
                      <Link href="/admin/users/new">
                        <Button size="sm" variant="outline" className="mt-1 cursor-pointer">
                          <Plus className="w-3 h-3 mr-1" /> Agregar usuario
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === Role.ADMIN ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "success" : "destructive"}>
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button variant="ghost" size="icon" className="cursor-pointer h-8 w-8" aria-label="Editar usuario">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(user.id)}
                          aria-label="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar usuario"
        description="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
