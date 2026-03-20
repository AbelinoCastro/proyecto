-- =============================================================
-- 01_crear_usuario.sql
-- Ejecutar como: ADMIN (nube) o SYSTEM (local)
-- Descripcion: Crea el usuario NOMINA_ADMIN con permisos
-- =============================================================

-- Para Oracle Cloud (ADMIN):
CREATE USER nomina_admin IDENTIFIED BY "NominaGT_2026!";

-- Para Oracle Local XE (SYSTEM), primero cambiar al PDB:
-- ALTER SESSION SET CONTAINER = XEPDB1;
-- CREATE USER nomina_admin IDENTIFIED BY "NominaGT_2026!";

GRANT CONNECT, RESOURCE TO nomina_admin;
GRANT CREATE SESSION TO nomina_admin;
GRANT UNLIMITED TABLESPACE TO nomina_admin;
