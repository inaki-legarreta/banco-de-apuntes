/*
 * hacer-admin.sql — Marca al primer admin (BD3). NO es una migración.
 *
 * Se corre UNA SOLA VEZ, a mano, en el SQL Editor de Supabase, después de aplicar
 * 001-perfiles.sql y de crear la cuenta de Iñaki en Authentication → Users.
 * Paso a paso completo en docs/base-de-datos.md.
 *
 * Antes de correrlo: reemplazar TU_EMAIL_AQUI por el email de la cuenta (no commitear el
 * archivo con el email real). El resultado tiene que mostrar UNA fila con rol = admin;
 * si no muestra ninguna, el email no coincide con ninguna cuenta.
 *
 * Usa insert ... on conflict en vez de un update simple para que funcione aunque la
 * cuenta no tuviera perfil todavía. Volver a correrlo no cambia nada.
 */

insert into public.perfiles (id, rol)
select u.id, 'admin'
from auth.users as u
where lower(u.email) = lower('TU_EMAIL_AQUI')
on conflict (id) do update
  set rol = 'admin'
returning id, rol;
