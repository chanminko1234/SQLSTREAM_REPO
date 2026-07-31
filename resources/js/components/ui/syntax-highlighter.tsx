import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/components/ThemeProvider';

interface CodeHighlighterProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export const CodeHighlighter: React.FC<CodeHighlighterProps> = ({
  code,
  language = 'sql',
  className = '',
  showLineNumbers = true,
}) => {
  const { theme } = useTheme();
  
  const isDark = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return (
    <SyntaxHighlighter
      language={language}
      style={isDark ? tomorrow : prism}
      showLineNumbers={showLineNumbers}
      className={`rounded-md ${className}`}
      customStyle={{
        margin: 0,
        padding: '1.25rem',
        fontSize: '0.875rem',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        backgroundColor: 'transparent',
      }}
      lineNumberStyle={{
        color: 'hsl(var(--muted-foreground))',
        fontSize: '0.75rem',
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};

export default CodeHighlighter;