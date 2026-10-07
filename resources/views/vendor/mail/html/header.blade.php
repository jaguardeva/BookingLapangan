@props(['url'])
<tr>
<td class="header" align="center">
<a href="{{ $url }}" style="display: inline-block;">
<img src="{{ rtrim(config('app.url'), '/') }}/favicon.svg" width="42" height="42" alt="{{ config('app.name') }}" class="brand-logo" />
<span class="brand-name">{{ config('app.name') }}</span>
</a>
</td>
</tr>
