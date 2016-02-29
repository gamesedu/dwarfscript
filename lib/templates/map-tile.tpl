<div class="ds-map-tile
<% if (locals.x === 0) { %>
  clear
<% } %>
<% if (locals.imgClass) { %>
  ds-sprite-wall
  ds-sprite-<%- locals.imgClass %>
<% } %>
" data-position-x="<%- locals.x %>" data-position-y="<%- locals.y %>">
</div>
