export const useTriggerDownload = () => {
  const triggerDownload = (url: string) => {
    console.log("Triggering download for URL:", url);
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { triggerDownload };
};
