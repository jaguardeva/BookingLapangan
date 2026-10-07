import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { LapanganForm } from '@/components/admin/lapangan-form';
import type { Category, Facility } from '@/types/booking';

interface Props {
    categories: Category[];
    facilities: Facility[];
}

export default function AdminLapanganCreate({ categories, facilities }: Props) {
    return <AppLayout breadcrumbs={[{ title: 'Superadmin Workspace', href: '/admin' }, { title: 'Kelola Lapangan', href: '/admin/lapangans' }, { title: 'Tambah Lapangan', href: '/admin/lapangans/create' }]}><Head title="Tambah Lapangan" /><div className="flex flex-1 flex-col gap-6 p-4 sm:p-6"><div><h1 className="text-2xl font-bold tracking-tight">Tambah Lapangan</h1><p className="mt-1 text-sm text-muted-foreground">Tambahkan informasi lapangan, jadwal operasional, foto, dan fasilitas.</p></div><div className="max-w-4xl rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7"><LapanganForm mode="create" categories={categories} facilities={facilities} /></div></div></AppLayout>;
}
