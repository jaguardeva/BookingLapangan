import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface SearchableSelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    id?: string;
    value: string;
    options: SearchableSelectOption[];
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
}

export function SearchableSelect({
    id,
    value,
    options,
    onValueChange,
    placeholder = 'Pilih opsi',
    searchPlaceholder = 'Cari opsi...',
    emptyMessage = 'Opsi tidak ditemukan.',
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const selectedOption = options.find((option) => option.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                id={id}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="h-10 w-full justify-between rounded-xl px-3 text-left text-sm font-normal"
            >
                <span className={selectedOption ? 'truncate' : 'truncate text-muted-foreground'}>
                    {selectedOption?.label ?? placeholder}
                </span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        {options.map((option) => (
                            <CommandItem key={option.value} value={option.label} onSelect={() => {
                                onValueChange(option.value);
                                setOpen(false);
                            }}>
                                <Check className={`mr-2 size-4 ${option.value === value ? 'opacity-100' : 'opacity-0'}`} />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
