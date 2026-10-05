@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
<span style="display:inline-block; margin-right:8px; padding:8px 10px; border-radius:10px; background:#059669; color:#ffffff; font-size:15px; font-weight:800; letter-spacing:1px; vertical-align:middle;">{{ Illuminate\Support\Str::upper(Illuminate\Support\Str::substr(config('app.name'), 0, 2)) }}</span>
<span style="vertical-align:middle;">{{ config('app.name') }}</span>
</a>
</td>
</tr>
