import { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';

// Initialize Mermaid once
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#22c55e',
      primaryTextColor: '#fff',
      primaryBorderColor: '#22c55e',
      lineColor: '#22c55e',
      secondaryColor: '#1e293b',
      tertiaryColor: '#0f172a'
    }
  });
} catch (e) {
  console.error('Failed to initialize mermaid', e);
}

// ─── Mathematical Unicode Symbol Formatter ──────────────────────────────────
const formatMath = (latex: string): string => {
  let text = latex;

  const greek: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε',
    '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π',
    '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
    '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ', '\\Xi': 'Ξ',
    '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Upsilon': 'Υ', '\\Phi': 'Φ', '\\Psi': 'Ψ',
    '\\Omega': 'Ω'
  };

  const symbols: Record<string, string> = {
    '\\infty': '∞', '\\approx': '≈', '\\neq': '≠', '\\leq': '≤', '\\geq': '≥',
    '\\times': '×', '\\div': '÷', '\\pm': '±', '\\mp': '∓', '\\cdot': '·',
    '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
    '\\Rightarrow': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
    '\\partial': '∂', '\\nabla': '∇', '\\sum': '∑', '\\prod': '∏', '\\coprod': '∐',
    '\\int': '∫', '\\iint': '∬', '\\iiint': '∭', '\\oint': '∮',
    '\\forall': '∀', '\\exists': '∃', '\\nexists': '∄', '\\emptyset': '∅',
    '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
    '\\subseteq': '⊆', '\\supseteq': '⊇', '\\cup': '∪', '\\cap': '∩',
    '\\sqrt': '√'
  };

  for (const [key, val] of Object.entries(greek)) {
    text = text.split(key).join(val);
  }
  for (const [key, val] of Object.entries(symbols)) {
    text = text.split(key).join(val);
  }

  text = text.replace(/\\frac\s*{(.*?)}\s*{(.*?)}/g, '($1/$2)');

  const subscripts: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
    'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ'
  };
  
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ'
  };

  text = text.replace(/_{(.*?)}/g, (_, p1) => p1.split('').map((char: string) => subscripts[char] || char).join(''));
  text = text.replace(/_([0-9a-z])/g, (_, p1) => subscripts[p1] || p1);
  text = text.replace(/\^{(.*?)}/g, (_, p1) => p1.split('').map((char: string) => superscripts[char] || char).join(''));
  text = text.replace(/\^([0-9+\-n])/g, (_, p1) => superscripts[p1] || p1);
  text = text.replace(/\\/g, '');

  return text;
};

// ─── Code Block Renderer with Copy Action ──────────────────────────────────
const CodeBlock = ({ content, lang, themeColorClass }: { content: string; lang?: string; themeColorClass: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative border border-white/10 rounded-lg overflow-hidden bg-black/40 my-3.5 font-mono">
      <div className="px-4 py-1.5 bg-white/5 border-b border-white/5 flex justify-between items-center text-[10px] text-secondary-txt/60 uppercase tracking-wider select-none">
        <span>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="hover:text-white transition-colors text-[9px] flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check size={10} className={themeColorClass} />
              <span className={themeColorClass}>Copied</span>
            </>
          ) : (
            <>
              <Copy size={10} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className={`p-4 overflow-x-auto text-[12px] leading-relaxed whitespace-pre ${themeColorClass}`}>
        <code>{content}</code>
      </pre>
    </div>
  );
};

// ─── Mermaid Diagrams Renderer ─────────────────────────────────────────────
const MermaidBlock = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    let active = true;
    const renderChart = async () => {
      if (!containerRef.current) return;
      const cleanChart = chart.trim();
      if (!cleanChart) return;
      try {
        setError(null);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);
        
        if (active) {
          setSvg(renderedSvg);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        if (active) {
          const errorMsg = err?.message || String(err);
          setError(errorMsg.split('\n')[0] || 'Diagram syntax error');
        }
      }
    };

    renderChart();

    return () => {
      active = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-3.5 border border-red-500/20 rounded-lg overflow-hidden bg-red-950/10 font-mono">
        <div className="px-4 py-1.5 bg-red-950/20 border-b border-red-500/20 text-[10px] text-red-400 uppercase tracking-wider select-none">
          Mermaid Render Error
        </div>
        <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed text-red-400/90 whitespace-pre">
          <code>{error}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="relative border border-white/10 rounded-lg overflow-hidden bg-black/40 my-3.5 p-4 flex justify-center items-center">
      <div className="absolute top-2 right-2 text-[8px] font-mono text-secondary-txt/30 uppercase tracking-widest pointer-events-none select-none">
        Diagram_Canvas
      </div>
      <div 
        ref={containerRef}
        className="w-full flex justify-center overflow-x-auto custom-scrollbar select-none"
        dangerouslySetInnerHTML={{ __html: svg || '<div class="text-[11px] text-secondary-txt/40 font-mono animate-pulse">RENDERING_DIAGRAM...</div>' }}
      />
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
interface MarkdownRendererProps {
  content: string;
  theme?: 'online' | 'offline';
}

export const MarkdownRenderer = ({ content, theme = 'offline' }: MarkdownRendererProps) => {
  if (!content) return null;

  const themeColorClass = theme === 'offline' ? 'text-offline-core' : 'text-theme-accent';

  // ─── Pre-process raw markdown text for math tags ───
  let processed = content;
  
  // Replace block math $$...$$ with a raw HTML wrapper
  processed = processed.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, equation) => {
    return `<div class="math-block">${equation.trim()}</div>`;
  });

  // Replace inline math $...$ with a raw HTML wrapper
  processed = processed.replace(/\$\s*([^\$\n]+?)\s*\$/g, (_, equation) => {
    // Avoid breaking normal currency format (e.g. $20.00)
    if (/^\d+(?:\.\d+)?$/.test(equation.trim())) {
      return `$${equation}`;
    }
    return `<span class="math-inline">${equation.trim()}</span>`;
  });

  // ─── Custom react-markdown element components ───
  const components = {
    // Code blocks & Mermaid diagrams
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : '';
      const textContent = String(children).replace(/\n$/, '');

      // Check if code block is inline (no class)
      const isInline = !className;

      if (!isInline && lang === 'mermaid') {
        return <MermaidBlock chart={textContent} />;
      }

      if (!isInline) {
        return (
          <CodeBlock
            content={textContent}
            lang={lang}
            themeColorClass={themeColorClass}
          />
        );
      }

      return (
        <code className={`bg-white/5 border border-white/10 px-1 py-0.5 rounded font-mono text-[12px] ${themeColorClass}`} {...props}>
          {children}
        </code>
      );
    },

    // Headers
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold font-mono tracking-tight text-white mb-2 mt-4 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-bold font-mono tracking-tight text-white mb-2 mt-3 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-md font-bold font-mono tracking-tight text-white mb-1 mt-2.5 first:mt-0">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-sm font-semibold font-mono tracking-tight text-white mb-1 mt-2 first:mt-0">
        {children}
      </h4>
    ),

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-white/20 pl-3.5 italic text-secondary-txt/80 my-2 leading-relaxed">
        {children}
      </blockquote>
    ),

    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc pl-5 my-2 space-y-1">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-5 my-2 space-y-1">
        {children}
      </ol>
    ),
    input: ({ type, checked, ...props }: any) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className={`mt-1 mr-2 shrink-0 ${
              theme === 'offline' ? 'accent-offline-core' : 'accent-theme-accent'
            }`}
            {...props}
          />
        );
      }
      return <input type={type} checked={checked} {...props} />;
    },

    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4 border border-white/10 rounded-lg bg-black/20 shadow-lg max-w-full">
        <table className="w-full border-collapse text-left">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="border-b border-white/10 bg-white/5 font-mono text-[10px] tracking-wider uppercase">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-white/5 font-sans text-xs">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-white/[0.02] even:bg-white/[0.01] transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className={`px-4 py-2 font-bold ${themeColorClass}`}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2 text-secondary-txt/90">
        {children}
      </td>
    ),

    // Horizontal Rule
    hr: () => <hr className="border-t border-white/10 my-4" />,

    // Links
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline hover:text-white transition-colors ${themeColorClass}`}
        {...props}
      >
        {children}
      </a>
    ),

    // Paragraph
    p: ({ children }: any) => (
      <p className="leading-relaxed whitespace-pre-wrap mb-2">
        {children}
      </p>
    ),

    // Custom HTML Details block rendering via rehype-raw
    details: ({ children }: any) => (
      <details className="my-3 border border-white/10 rounded-lg bg-black/20 overflow-hidden">
        {children}
      </details>
    ),
    summary: ({ children }: any) => (
      <summary className="px-4 py-2 bg-white/5 font-mono text-[10px] font-bold text-primary-txt/90 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none outline-none">
        {children}
      </summary>
    ),

    // Custom classes generated by math preprocessor
    div: ({ className, children, ...props }: any) => {
      if (className === 'math-block') {
        const latex = String(children);
        return (
          <div className="my-4 p-4 rounded-lg bg-white/5 border border-white/10 flex justify-center items-center text-center font-serif italic text-md text-primary-txt select-all shadow-md">
            <span className="tracking-wide text-[15px]">
              {formatMath(latex)}
            </span>
          </div>
        );
      }
      return <div className={className} {...props}>{children}</div>;
    },
    span: ({ className, children, ...props }: any) => {
      if (className === 'math-inline') {
        const latex = String(children);
        return (
          <span className="font-serif italic bg-white/5 px-1 rounded text-primary-txt/90 mx-0.5 tracking-wide text-[13px]">
            {formatMath(latex)}
          </span>
        );
      }
      return <span className={className} {...props}>{children}</span>;
    }
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {processed}
    </ReactMarkdown>
  );
};
