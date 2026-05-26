import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica'
    },
    headerSection: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 10
    },
    title: {
        fontSize: 24,
        color: '#111827',
        fontWeight: 'bold',
        marginBottom: 4
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280'
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 15,
        marginBottom: 10,
        backgroundColor: '#F3F4F6',
        padding: 5
    },
    // Table Styles
    table: {
        display: "table",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRightWidth: 0,
        borderBottomWidth: 0
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row"
    },
    tableHeaderRow: {
        margin: "auto",
        flexDirection: "row",
        backgroundColor: '#F9FAFB'
    },
    tableCol: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 0,
        borderTopWidth: 0
    },
    tableColDescription: {
        width: "40%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 0,
        borderTopWidth: 0
    },
    tableColSmall: {
        width: "15%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 0,
        borderTopWidth: 0
    },
    tableCellHeader: {
        margin: 5,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151'
    },
    tableCell: {
        margin: 5,
        fontSize: 10,
        color: '#4B5563'
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    statBox: {
        width: '30%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 4,
        alignItems: 'center'
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827'
    },
    statLabel: {
        fontSize: 10,
        color: '#6B7280',
        textTransform: 'uppercase',
        marginTop: 2
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10
    }
});

const TeamReport = ({ staffer, stats, tasks, projects }) => {
    const today = format(new Date(), 'dd/MM/yyyy');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerSection}>
                    <Text style={styles.title}>{staffer?.name || 'Reporte de Equipo'}</Text>
                    <Text style={styles.subtitle}>{staffer?.role_description || 'Sin rol asignado'}  |  Generado: {today}</Text>
                </View>

                {/* Stats Summary */}
                {stats && (
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{stats.active}</Text>
                            <Text style={styles.statLabel}>Tareas Activas</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{stats.completed}</Text>
                            <Text style={styles.statLabel}>Completadas</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                    </View>
                )}

                {/* Tasks Table */}
                <Text style={styles.sectionTitle}>Listado de Tareas</Text>
                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableHeaderRow}>
                        <View style={styles.tableColDescription}>
                            <Text style={styles.tableCellHeader}>Descripción</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCellHeader}>Proyecto</Text>
                        </View>
                        <View style={styles.tableColSmall}>
                            <Text style={styles.tableCellHeader}>Fecha Fin</Text>
                        </View>
                        <View style={styles.tableColSmall}>
                            <Text style={styles.tableCellHeader}>Estado</Text>
                        </View>
                    </View>

                    {/* Rows */}
                    {tasks.length === 0 ? (
                        <View style={styles.tableRow}>
                            <View style={{ ...styles.tableColDescription, width: '100%' }}>
                                <Text style={styles.tableCell}>No hay tareas asignadas para este integrante.</Text>
                            </View>
                        </View>
                    ) : (
                        tasks.map((task, idx) => {
                            const project = projects.find(p => p.id === task.proyecto_id);
                            return (
                                <View style={styles.tableRow} key={task.id || idx}>
                                    <View style={styles.tableColDescription}>
                                        <Text style={styles.tableCell}>{task.task_description}</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{project?.name || task.proyecto?.name || '-'}</Text>
                                    </View>
                                    <View style={styles.tableColSmall}>
                                        <Text style={styles.tableCell}>
                                            {task.fecha_fin_estimada ? format(new Date(task.fecha_fin_estimada), 'dd/MM/yyyy') : '-'}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColSmall}>
                                        <Text style={styles.tableCell}>
                                            {task.finished ? 'Completada' : 'Activa'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Reporte generado por Arq.tvs el {today}
                </Text>
            </Page>
        </Document>
    );
};

export default TeamReport;
