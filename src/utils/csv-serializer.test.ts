import { describe, it, expect } from 'vitest';
import {
  generateCsv,
  sanitizeFormulaInjection,
  sanitizeFilename,
  buildExportFilename,
  type CsvColumn,
} from './csv-serializer';

describe('csv-serializer', () => {
  describe('generateCsv', () => {
    it('returns headers only with CRLF for zero rows', () => {
      const columns: CsvColumn<{ name: string; age: number }>[] = [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age' },
      ];
      const csv = generateCsv([], columns);
      expect(csv).toBe('Name,Age\r\n');
    });

    it('generates standard CSV with deterministic column ordering', () => {
      interface Person {
        id: string;
        name: string;
        score: number;
      }
      const data: Person[] = [
        { id: '1', name: 'Alice', score: 95 },
        { id: '2', name: 'Bob', score: 80 },
      ];
      const columns: CsvColumn<Person>[] = [
        { key: 'name', header: 'Full Name' },
        { key: 'score', header: 'Final Score' },
      ];
      const csv = generateCsv(data, columns);
      expect(csv).toBe('Full Name,Final Score\r\nAlice,95\r\nBob,80');
    });

    it('handles null and undefined values as empty strings', () => {
      interface Row {
        name: string;
        notes?: string | null;
        status?: string;
      }
      const data: Row[] = [
        { name: 'Alice', notes: null },
        { name: 'Bob', notes: undefined, status: 'active' },
      ];
      const columns: CsvColumn<Row>[] = [
        { key: 'name', header: 'Name' },
        { key: 'notes', header: 'Notes' },
        { key: 'status', header: 'Status' },
      ];
      const csv = generateCsv(data, columns);
      expect(csv).toBe('Name,Notes,Status\r\nAlice,,\r\nBob,,active');
    });

    it('escapes cells containing commas and quotes correctly', () => {
      interface Row {
        comment: string;
      }
      const data: Row[] = [
        { comment: 'Hello, World' },
        { comment: 'She said "Yes"' },
        { comment: 'A "quote", with comma' },
      ];
      const columns: CsvColumn<Row>[] = [{ key: 'comment', header: 'Comment' }];
      const csv = generateCsv(data, columns);
      expect(csv).toBe(
        'Comment\r\n"Hello, World"\r\n"She said ""Yes"""\r\n"A ""quote"", with comma"'
      );
    });

    it('escapes cells containing newlines and CRLF', () => {
      interface Row {
        text: string;
      }
      const data: Row[] = [
        { text: 'Line 1\nLine 2' },
        { text: 'Line A\r\nLine B' },
      ];
      const columns: CsvColumn<Row>[] = [{ key: 'text', header: 'Text' }];
      const csv = generateCsv(data, columns);
      expect(csv).toBe(
        'Text\r\n"Line 1\nLine 2"\r\n"Line A\r\nLine B"'
      );
    });

    it('correctly handles Unicode characters', () => {
      interface Row {
        name: string;
        location: string;
      }
      const data: Row[] = [
        { name: 'José González', location: 'São Paulo' },
        { name: '李伟', location: '北京' },
        { name: 'Fatima Al-Zahra', location: 'القاهرة' },
      ];
      const columns: CsvColumn<Row>[] = [
        { key: 'name', header: 'Name' },
        { key: 'location', header: 'Location' },
      ];
      const csv = generateCsv(data, columns);
      expect(csv).toBe(
        'Name,Location\r\nJosé González,São Paulo\r\n李伟,北京\r\nFatima Al-Zahra,القاهرة'
      );
    });

    it('preserves negative numbers without single-quote formula prefix', () => {
      interface MetricRow {
        label: string;
        change: number;
      }
      const data: MetricRow[] = [
        { label: 'Gain', change: -12.5 },
        { label: 'Positive', change: 25.0 },
      ];
      const columns: CsvColumn<MetricRow>[] = [
        { key: 'label', header: 'Metric' },
        { key: 'change', header: 'Change' },
      ];
      const csv = generateCsv(data, columns);
      expect(csv).toBe('Metric,Change\r\nGain,-12.5\r\nPositive,25');
    });

    it('uses custom getValue function when provided in column definition', () => {
      interface Item {
        passed: boolean | null;
      }
      const data: Item[] = [{ passed: true }, { passed: false }, { passed: null }];
      const columns: CsvColumn<Item>[] = [
        {
          key: 'passed',
          header: 'Result',
          getValue: (r) => (r.passed === null ? 'N/A' : r.passed ? 'PASS' : 'FAIL'),
        },
      ];
      const csv = generateCsv(data, columns);
      expect(csv).toBe('Result\r\nPASS\r\nFAIL\r\nN/A');
    });
  });

  describe('sanitizeFormulaInjection', () => {
    it('neutralizes standard formula prefixes', () => {
      expect(sanitizeFormulaInjection('=1+1')).toBe("'=1+1");
      expect(sanitizeFormulaInjection('+cmd')).toBe("'+cmd");
      expect(sanitizeFormulaInjection('-formula')).toBe("'-formula");
      expect(sanitizeFormulaInjection('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
    });

    it('neutralizes formula prefixes preceded by whitespace and control characters', () => {
      expect(sanitizeFormulaInjection(' =1+1')).toBe("' =1+1");
      expect(sanitizeFormulaInjection('   +cmd')).toBe("'   +cmd");
      expect(sanitizeFormulaInjection('\t=1+1')).toBe("'\t=1+1");
      expect(sanitizeFormulaInjection('\r\n@formula')).toBe("'\r\n@formula");
      expect(sanitizeFormulaInjection('  -sensitive')).toBe("'  -sensitive");
    });

    it('leaves safe text unaltered', () => {
      expect(sanitizeFormulaInjection('Normal Text')).toBe('Normal Text');
      expect(sanitizeFormulaInjection('123 Main St')).toBe('123 Main St');
      expect(sanitizeFormulaInjection('john.doe@example.com')).toBe('john.doe@example.com');
    });
  });

  describe('sanitizeFilename', () => {
    it('handles normal cohort codes', () => {
      expect(sanitizeFilename('COHORT-2026-A')).toBe('COHORT-2026-A');
    });

    it('replaces slashes and backslashes', () => {
      expect(sanitizeFilename('cohort/2026\\A')).toBe('cohort_2026_A');
    });

    it('prevents directory traversal attacks', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('etc_passwd');
    });

    it('strips control characters', () => {
      expect(sanitizeFilename('cohort\x00\x1fname')).toBe('cohortname');
    });

    it('collapses repeated underscores and removes boundary punctuation', () => {
      expect(sanitizeFilename('__cohort___name__')).toBe('cohort_name');
    });
  });

  describe('buildExportFilename', () => {
    it('builds standard deterministic filenames with dates', () => {
      const mockDate = new Date(2026, 8, 8); // Sept 8, 2026
      const filename = buildExportFilename('BLS-2026-01', 'roster', mockDate);
      expect(filename).toBe('bls_BLS-2026-01_roster_2026-09-08.csv');
    });

    it('safely sanitizes unsafe cohort codes in filenames', () => {
      const mockDate = new Date(2026, 8, 8);
      const filename = buildExportFilename('../cohort/unsafe code!', 'pre-test-results', mockDate);
      expect(filename).toBe('bls_cohort_unsafe_code_pre-test-results_2026-09-08.csv');
    });
  });
});
