import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

/** Clickable table header cell that toggles sort field/direction. */
const SortableHeader = ({ field, label, current, dir, onSort, align = 'right' }) => {
    const active = current === field;
    const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
    return (
        <th
            className={`px-4 py-3 whitespace-nowrap ${ALIGN[align] || ALIGN.right} cursor-pointer select-none hover:text-slate-700 dark:hover:text-white/70 transition-colors`}
            onClick={() => onSort(field)}
        >
            <span className="inline-flex items-center gap-1">
                {label}
                <Icon size={12} className={active ? 'text-purple-500' : 'opacity-40'} />
            </span>
        </th>
    );
};

export default SortableHeader;
