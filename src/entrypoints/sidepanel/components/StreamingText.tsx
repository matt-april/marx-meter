import { useState, useEffect } from 'preact/hooks';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
}

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState(text);

  useEffect(() => {
    if (isStreaming && text.length > displayedText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text);
      }, 20);
      return () => clearTimeout(timeout);
    } else {
      setDisplayedText(text);
    }
  }, [text, isStreaming, displayedText.length]);

  return (
    <span>
      {displayedText}
      {isStreaming && (
        <span class="inline-block h-4 w-0.5 animate-pulse bg-neutral-400 ml-0.5 align-middle" />
      )}
    </span>
  );
}
