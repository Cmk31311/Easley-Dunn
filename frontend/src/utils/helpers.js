import {
  Play,
  Database,
  Shield,
  BarChart2,
  Mail,
  Bolt,
  Lock,
  Calendar,
  FileText
} from "lucide-react";

export const getServiceIcon = (serviceCode, serviceName) => {
  const code = serviceCode?.toUpperCase() || "";
  const name = serviceName?.toLowerCase() || "";

  if (code.includes("PLAY") || name.includes("play")) return Play;
  if (code.includes("BIG_QUERY") || code.includes("BIGQUERY") || name.includes("bigquery") || name.includes("big query") || name.includes("database")) return Database;
  if (code.includes("DRIVE") || name.includes("drive")) return Shield;
  if (code.includes("ANALYTICS") || name.includes("analytics")) return BarChart2;
  if (name.includes("email") || name.includes("mail")) return Mail;
  if (name.includes("slack")) return Bolt;
  if (name.includes("github") || name.includes("organization") || name.includes("vpn") || name.includes("access")) return Lock;
  if (name.includes("calendar")) return Calendar;
  if (name.includes("confluence") || name.includes("jira") || name.includes("wiki")) return FileText;

  return Shield;
};

export const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  const first = parts[0]?.charAt(0) || "";
  const last = parts[parts.length - 1]?.charAt(0) || "";
  return (first + last).toUpperCase();
};

export const getAvatarColor = (name) => {
  if (!name) return "bg-[#0a2540] text-white";
  const colors = [
    "bg-[#0a2540] text-white",
    "bg-[#1e3a5f] text-white",
    "bg-[#3b6d9a] text-white",
    "bg-[#0d9488] text-white",
    "bg-[#334155] text-white",
    "bg-[#1e293b] text-white",
    "bg-[#0f766e] text-white",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
