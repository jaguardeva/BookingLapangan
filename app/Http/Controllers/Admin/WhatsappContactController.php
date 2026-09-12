<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WhatsappContact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WhatsappContactController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/whatsapp-contacts/index', [
            'contacts' => WhatsappContact::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        WhatsappContact::create($this->validatedData($request));

        return back()->with('success', 'Kontak WhatsApp berhasil ditambahkan.');
    }

    public function update(Request $request, WhatsappContact $whatsappContact): RedirectResponse
    {
        $whatsappContact->update($this->validatedData($request));

        return back()->with('success', 'Kontak WhatsApp berhasil diperbarui.');
    }

    public function destroy(WhatsappContact $whatsappContact): RedirectResponse
    {
        $whatsappContact->delete();

        return back()->with('info', 'Kontak WhatsApp berhasil dihapus.');
    }

    public function toggle(WhatsappContact $whatsappContact): RedirectResponse
    {
        $whatsappContact->update(['is_active' => ! $whatsappContact->is_active]);

        return back()->with('success', 'Status kontak WhatsApp berhasil diperbarui.');
    }

    /**
     * @return array{name: string, phone: string, description: ?string, is_active: bool, sort_order: int}
     */
    private function validatedData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^[0-9+()\s-]+$/'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:999'],
        ]) + [
            'is_active' => $request->boolean('is_active'),
        ];
    }
}
