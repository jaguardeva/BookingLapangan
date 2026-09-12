@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel')
<img src="https://laravel.com/img/notification-logo-v2.1.png" class="logo" alt="Laravel Logo">
@else
<span style="display:inline-block; margin-right:8px; padding:8px 10px; border-radius:10px; background:#059669; color:#ffffff; font-size:15px; font-weight:800; letter-spacing:1px; vertical-align:middle;">SB</span>
<span style="vertical-align:middle;">{!! $slot !!}</span>
@endif
</a>
</td>
</tr>
