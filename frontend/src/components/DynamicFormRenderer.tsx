'use client';

import React from 'react';
import { FieldDefinition } from '@/services/api';

interface DynamicFormRendererProps {
    fields: FieldDefinition[];
    values: Record<string, unknown>;
    onChange: (slug: string, value: unknown) => void;
    disabled?: boolean;
}

export default function DynamicFormRenderer({ fields, values, onChange, disabled }: DynamicFormRendererProps) {
    const sortedFields = [...fields].sort((a, b) => a.order - b.order);

    const renderField = (field: FieldDefinition) => {
        const value = values[field.slug] ?? field.default_value ?? '';

        switch (field.field_type) {
            case 'text':
            case 'url':
            case 'email':
                return (
                    <input
                        type={field.field_type === 'url' ? 'url' : field.field_type === 'email' ? 'email' : 'text'}
                        value={String(value)}
                        onChange={(e) => onChange(field.slug, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                        required={field.is_required}
                        disabled={disabled}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 transition-all"
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={String(value)}
                        onChange={(e) => onChange(field.slug, e.target.value ? Number(e.target.value) : '')}
                        placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                        required={field.is_required}
                        disabled={disabled}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 transition-all"
                    />
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={String(value)}
                        onChange={(e) => onChange(field.slug, e.target.value)}
                        required={field.is_required}
                        disabled={disabled}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 transition-all"
                    />
                );

            case 'select':
                const choices = (field.options as { choices?: string[] })?.choices || [];
                return (
                    <select
                        value={String(value)}
                        onChange={(e) => onChange(field.slug, e.target.value)}
                        required={field.is_required}
                        disabled={disabled}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 transition-all appearance-none"
                    >
                        <option value="">Select {field.name}...</option>
                        {choices.map((choice: string) => (
                            <option key={choice} value={choice}>{choice}</option>
                        ))}
                    </select>
                );

            case 'boolean':
                return (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => onChange(field.slug, e.target.checked)}
                            disabled={disabled}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/50"
                        />
                        <span className="text-sm text-slate-600">{field.name}</span>
                    </label>
                );

            default:
                return (
                    <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => onChange(field.slug, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                        disabled={disabled}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 transition-all"
                    />
                );
        }
    };

    return (
        <div className="space-y-4">
            {sortedFields.map((field) => (
                <div key={field.slug}>
                    {field.field_type !== 'boolean' && (
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            {field.name}
                            {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                    )}
                    {renderField(field)}
                </div>
            ))}
        </div>
    );
}
