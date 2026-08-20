import React, { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({
  formula,
  displayMode = false,
  className = '',
}) => {
  const html = useMemo(() => {
    const rawFormula = typeof formula === 'string' ? formula : String(formula || '');
    if (!rawFormula.trim()) return '';
    try {
      return katex.renderToString(rawFormula, {
        displayMode,
        throwOnError: false,
        strict: 'ignore',
      });
    } catch (err) {
      console.error('KaTeX rendering error:', err);
      return `<span class="text-amber-400 font-mono">${rawFormula}</span>`;
    }
  }, [formula, displayMode]);

  return (
    <span
      className={`inline-block math-rendered ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
