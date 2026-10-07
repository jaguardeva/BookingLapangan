import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { LapanganForm } from '@/components/admin/lapangan-form';
import type { Category, Facility, Lapangan } from '@/types/booking';

interface Props {
    categories: Category[];
    facilities: Facility[];
    lapangan: Lapangan;
}

export default function AdminLapanganEdit({ categories, facilities, lapangan }: Props) {
    return <AppLayout breadcrumbs={[{ title: 'Superadmin Workspace', href: '/admin' }, { title: 'Kelola Lapangan', href: '/admin/lapangans' }, { title: `Edit ${lapangan.name}`, href: `/admin/lapangans/${lapangan.id}/edit` }]}><Head title={`Edit ${lapangan.name}`} /><div className="flex flex-1 flex-col gap-6 p-4 sm:p-6"><div><h1 className="text-2xl font-bold tracking-tight">Edit Lapangan</h1><p className="mt-1 text-sm text-muted-foreground">Perbarui informasi, foto, jadwal, dan fasilitas lapangan.</p></div><div className="max-w-4xl rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7"><LapanganForm mode="edit" categories={categories} facilities={facilities} lapangan={lapangan} /></div></div></AppLayout>;
}
