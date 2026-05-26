import supabase from '../config/supabaseClient.js';

/**
 * Script de verificación de base de datos Supabase
 * Verifica qué tablas existen, cuántos registros tienen, y si hay problemas de acceso
 */

const EXPECTED_TABLES = [
    'Tareas',
    'Acciones',
    'Proyectos',
    'Materiales',
    'Espacio_Elemento',
    'Componentes',
    'Instancias_Componentes',
    'Staff',
    'Stage',
    'Protocolos',
    'Directorio'
];

async function checkTable(tableName) {
    try {
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (error) {
            return {
                table: tableName,
                exists: false,
                error: error.message,
                count: 0,
                finished: '❌'
            };
        }

        return {
            table: tableName,
            exists: true,
            count: count || 0,
            finished: count > 0 ? '✅' : '⚠️',
            message: count > 0 ? `${count} registros` : 'Tabla vacía'
        };
    } catch (err) {
        return {
            table: tableName,
            exists: false,
            error: err.message,
            count: 0,
            finished: '❌'
        };
    }
}

async function verifyDatabase() {
    console.log('\n🔍 VERIFICACIÓN DE BASE DE DATOS SUPABASE\n');
    console.log('='.repeat(60));

    const results = [];

    for (const tableName of EXPECTED_TABLES) {
        const result = await checkTable(tableName);
        results.push(result);

        console.log(`${result.finished} ${result.table.padEnd(25)} | ${result.message || result.error}`);
    }

    console.log('='.repeat(60));

    // Resumen
    const existing = results.filter(r => r.exists);
    const withData = results.filter(r => r.exists && r.count > 0);
    const empty = results.filter(r => r.exists && r.count === 0);
    const missing = results.filter(r => !r.exists);

    console.log('\n📊 RESUMEN:');
    console.log(`  ✅ Tablas con datos: ${withData.length}/${EXPECTED_TABLES.length}`);
    console.log(`  ⚠️  Tablas vacías: ${empty.length}`);
    console.log(`  ❌ Tablas faltantes: ${missing.length}`);

    if (missing.length > 0) {
        console.log('\n⚠️  TABLAS FALTANTES:');
        missing.forEach(r => {
            console.log(`  - ${r.table}: ${r.error}`);
        });
        console.log('\n💡 SOLUCIÓN: Ejecuta los archivos SQL en src/context/*.sql en Supabase SQL Editor');
    }

    if (empty.length > 0) {
        console.log('\n⚠️  TABLAS VACÍAS:');
        empty.forEach(r => {
            console.log(`  - ${r.table}`);
        });
        console.log('\n💡 SOLUCIÓN: Importa datos desde src/context/*_rows.sql');
    }

    console.log('\n');
    return results;
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    verifyDatabase()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('❌ Error durante verificación:', err);
            process.exit(1);
        });
}

export default verifyDatabase;
