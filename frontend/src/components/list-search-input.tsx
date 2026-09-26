'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ListSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function ListSearchInput({ value, onChange, placeholder }: ListSearchInputProps) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-11 pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
