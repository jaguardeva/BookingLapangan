<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BankAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BankAccountController extends Controller
{
    public function index(): Response
    {
        $banks = BankAccount::latest()->get();

        return Inertia::render('admin/banks/index', [
            'banks' => $banks,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:50', 'unique:bank_accounts,account_number'],
            'account_name' => ['required', 'string', 'max:255'],
        ]);

        $bank = BankAccount::create([
            'bank_name' => strtoupper($validated['bank_name']),
            'account_number' => $validated['account_number'],
            'account_name' => strtoupper($validated['account_name']),
            'is_active' => true,
        ]);

        ActivityLog::log('bank_account_created', "Superadmin menambahkan rekening bank: {$bank->bank_name} {$bank->account_number}");

        return back()->with('success', "Rekening bank {$bank->bank_name} berhasil ditambahkan!");
    }

    public function update(Request $request, BankAccount $bankAccount): RedirectResponse
    {
        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:50', 'unique:bank_accounts,account_number,'.$bankAccount->id],
            'account_name' => ['required', 'string', 'max:255'],
        ]);

        $bankAccount->update([
            'bank_name' => strtoupper($validated['bank_name']),
            'account_number' => $validated['account_number'],
            'account_name' => strtoupper($validated['account_name']),
        ]);

        return back()->with('success', 'Rekening bank berhasil diperbarui!');
    }

    public function toggle(BankAccount $bankAccount): RedirectResponse
    {
        $bankAccount->update(['is_active' => ! $bankAccount->is_active]);

        $status = $bankAccount->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('info', "Rekening {$bankAccount->bank_name} {$status}.");
    }

    public function destroy(BankAccount $bankAccount): RedirectResponse
    {
        $name = $bankAccount->bank_name.' - '.$bankAccount->account_number;
        $bankAccount->delete();

        return back()->with('info', "Rekening {$name} berhasil dihapus.");
    }
}
