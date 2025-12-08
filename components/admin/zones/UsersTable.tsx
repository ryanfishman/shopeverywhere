"use client";

import { t } from "@/translations/translations";
import type { UserInfo } from "@/lib/api";

interface UsersTableProps {
  users: UserInfo[];
  locale: string;
}

export const UsersTable = ({ users, locale }: UsersTableProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
      <h3 className="text-lg font-bold text-slate-800 mb-4">{t(locale, "usersInZone")}</h3>
      <div className="max-h-72 overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-gray-500 uppercase text-xs">
              <th className="py-2">{t(locale, "user")}</th>
              <th className="py-2">{t(locale, "address")}</th>
              <th className="py-2 text-center">{t(locale, "open")}</th>
              <th className="py-2 text-center">{t(locale, "delivered")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t hover:bg-gray-50">
                <td className="py-2">
                  <div className="font-medium text-gray-900">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || t(locale, "unknown")}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="py-2 text-xs text-gray-600">
                  {[user.address, user.city, user.state, user.country, user.postalCode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>
                <td className="py-2 text-center text-indigo-600 font-semibold">{user.openCarts}</td>
                <td className="py-2 text-center text-green-600 font-semibold">{user.completedCarts}</td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-sm text-gray-400">
                  {t(locale, "noUsersInZone")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

