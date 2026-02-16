import ImageBackgroundRemoverTool from "@/components/ImageBackgroundRemoverTool";

export const metadata = {
  title: 'AI Background Remover - Nextooly Labs',
  description: 'Free open-source background removal tool running entirely in your browser.',
};

export default function BackgroundRemoverPage() {
  return <ImageBackgroundRemoverTool />;
}