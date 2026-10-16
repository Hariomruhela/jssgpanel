import type { ReactNode } from "react"
import { Fragment, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/lib/language"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface Column<T> {
  id: string
  header: string
  className?: string
  headClassName?: string
  cell: (row: T) => ReactNode
}

export interface TableFilter {
  key: string
  label: string
  options: { label: string; value: string }[]
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  searchKeys?: (row: T) => string
  searchPlaceholder?: string
  filters?: TableFilter[]
  rowKey: (row: T) => string
  toolbar?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  pageSize?: number
  initialPage?: number
  /** Server-side mode: pass `onPageChange` (plus optionally the callbacks below) to page, search and filter on the API instead of in the browser. */
  currentPage?: number
  total?: number
  onPageChange?: (page: number) => void
  onSearchChange?: (query: string) => void
  onFilterChange?: (key: string, value: string) => void
  /** The `rowKey` of the row currently expanded, if any. */
  expandedRowKey?: string | null
  /** Content rendered in a full-width row right below the expanded row. */
  renderExpandedRow?: (row: T) => ReactNode
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  searchKeys,
  searchPlaceholder,
  filters = [],
  rowKey,
  toolbar,
  emptyTitle,
  emptyDescription,
  pageSize = 10,
  initialPage = 1,
  currentPage,
  total,
  onPageChange,
  onSearchChange,
  onFilterChange,
  expandedRowKey,
  renderExpandedRow,
}: DataTableProps<T>) {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")
  const [filterState, setFilterState] = useState<Record<string, string>>({})
  const [page, setPage] = useState(initialPage)

  const searchPlaceholderText = searchPlaceholder ?? t("Search records…")
  const emptyTitleText = emptyTitle ?? t("No records found")
  const emptyDescriptionText = emptyDescription ?? t("Try adjusting the search or filters to see more results.")

  const serverSide = onPageChange !== undefined

  const filtered = useMemo(() => {
    if (serverSide) return data
    let rows = data
    const q = search.trim().toLowerCase()
    if (q && searchKeys) rows = rows.filter((r) => searchKeys(r).toLowerCase().includes(q))
    for (const f of filters) {
      const value = filterState[f.key]
      if (value && value !== "all") {
        rows = rows.filter((r) => String((r as Record<string, unknown>)[f.key]) === value)
      }
    }
    return rows
  }, [data, search, searchKeys, filters, filterState, serverSide])

  const recordCount = serverSide ? (total ?? data.length) : filtered.length
  const pageCount = Math.max(1, Math.ceil(recordCount / pageSize))
  const safePage = Math.min(serverSide ? Math.max(1, currentPage ?? 1) : page, pageCount)
  const start = (safePage - 1) * pageSize
  const visible = serverSide ? filtered : filtered.slice(start, start + pageSize)

  const resetPage = () => (serverSide ? onPageChange(1) : setPage(1))
  const changePage = (next: number) => (serverSide ? onPageChange(next) : setPage(next))

  const changeSearch = (value: string) => {
    setSearch(value)
    onSearchChange?.(value)
    resetPage()
  }

  const changeFilter = (key: string, value: string) => {
    setFilterState((s) => ({ ...s, [key]: value }))
    onFilterChange?.(key, value)
    resetPage()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {(searchKeys || onSearchChange || filters.length > 0) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {(searchKeys || onSearchChange) && (
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => changeSearch(e.target.value)}
                  placeholder={searchPlaceholderText}
                  className="w-full pl-8 sm:w-64"
                />
              </div>
            )}
            {filters.map((f) => (
              <Select
                key={f.key}
                value={filterState[f.key] ?? "all"}
                onValueChange={(v) => changeFilter(f.key, v)}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={f.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All {label}", { label: f.label })}</SelectItem>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
        {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
      </div>

      {/* Horizontal scroll, not hidden overflow: a wide table (this one has
          seven columns) would otherwise clip its rightmost Actions column and
          leave the buttons unreachable on narrow screens. */}
      <div className="overflow-x-auto rounded-xl border border-[rgba(150,120,55,0.2)] bg-[#fcfaf5]/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((c) => (
                <TableHead key={c.id} className={c.headClassName}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {columns.map((c) => (
                    <TableCell key={c.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <SearchX className="size-5 text-muted-foreground" />
                    </div>
                    <p className="font-medium">{emptyTitleText}</p>
                    <p className="max-w-xs text-xs text-muted-foreground">{emptyDescriptionText}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => {
                const key = rowKey(row)
                const expanded = renderExpandedRow != null && expandedRowKey === key
                return (
                  <Fragment key={key}>
                    <TableRow>
                      {columns.map((c) => (
                        <TableCell key={c.id} className={c.className}>
                          {c.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={columns.length} className="bg-muted/40 p-0">
                          {renderExpandedRow(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {visible.length === 0
            ? t("Showing 0 of {n} records", { n: recordCount })
            : t("Showing {start}–{end} of {n} records", {
                start: start + 1,
                end: start + visible.length,
                n: recordCount,
              })}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={safePage <= 1}
            onClick={() => changePage(Math.max(1, safePage - 1))}
          >
            <ChevronLeft />
          </Button>
          <span className="px-2 text-xs text-muted-foreground">
            {t("Page {page} of {total}", { page: safePage, total: pageCount })}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={safePage >= pageCount}
            onClick={() => changePage(Math.min(pageCount, safePage + 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}