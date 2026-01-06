// Pagination Component
export interface PaginationConfig {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export class PaginationHelper {
    static calculateTotalPages(totalItems: number, pageSize: number): number {
        return Math.ceil(totalItems / pageSize);
    }

    static getPagedData<T>(data: T[], page: number, pageSize: number): T[] {
        const startIndex = (page - 1) * pageSize;
        return data.slice(startIndex, startIndex + pageSize);
    }

    static getPageNumbers(currentPage: number, totalPages: number): number[] {
        const pages: number[] = [];
        const maxPagesToShow = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    }
}

// Excel Export Helper
export class ExcelExportHelper {
    static exportToExcel<T>(data: T[], filename: string, sheetName: string = 'Sheet1'): void {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        // Convert data to CSV
        const headers = Object.keys(data[0] as object);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = (row as any)[header];
                    // Escape commas and quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static exportTableToExcel(tableId: string, filename: string): void {
        const table = document.getElementById(tableId);
        if (!table) {
            alert('Table not found');
            return;
        }

        const rows = Array.from(table.querySelectorAll('tr'));
        const csvContent = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            return cells.map(cell => {
                const text = cell.textContent?.trim() || '';
                if (text.includes(',') || text.includes('"')) {
                    return `"${text.replace(/"/g, '""')}"`;
                }
                return text;
            }).join(',');
        }).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
