<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Facility;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FacilityManagementController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:facilities,name'],
            'icon' => ['nullable', 'string', 'max:100'],
        ]);

        $facility = Facility::create($validated);

        ActivityLog::log('facility_created', "Superadmin menambahkan fasilitas: {$facility->name}", [
            'facility_id' => $facility->id,
        ]);

        return back()->with('success', "Fasilitas {$facility->name} berhasil ditambahkan.");
    }

    public function update(Request $request, Facility $facility): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('facilities', 'name')->ignore($facility)],
            'icon' => ['nullable', 'string', 'max:100'],
        ]);

        $facility->update($validated);

        ActivityLog::log('facility_updated', "Superadmin memperbarui fasilitas: {$facility->name}", [
            'facility_id' => $facility->id,
        ]);

        return back()->with('success', "Fasilitas {$facility->name} berhasil diperbarui.");
    }
}
