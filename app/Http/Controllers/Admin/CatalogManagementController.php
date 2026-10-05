<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Facility;
use Inertia\Inertia;
use Inertia\Response;

class CatalogManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/catalog/index', [
            'categories' => Category::query()
                ->withCount('lapangans')
                ->orderBy('name')
                ->get(),
            'facilities' => Facility::query()
                ->withCount('lapangans')
                ->orderBy('name')
                ->get(),
        ]);
    }
}
