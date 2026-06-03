'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertCircle, Check, Copy, Key, Plus, Trash2 } from 'lucide-react'

interface ApiKey {
  apiKey: string
  maskedKey: string
  name: string
  tenantId: string
  createdAt: string
  revokedAt?: string
  active: boolean
}

interface NewKeyResult {
  apiKey: string
  tenantId: string
  name: string
  createdAt: string
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchKeys()
  }, [])

  async function fetchKeys() {
    try {
      const response = await fetch('/api/keys')
      const data = await response.json()
      setKeys(Array.isArray(data.keys) ? data.keys : [])
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load API keys')
    } finally {
      setLoading(false)
    }
  }

  async function generateKey() {
    if (!newKeyName.trim()) {
      setError('Please enter a name for this key')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newKeyName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate a new key')
      }

      setNewKey(data)
      setNewKeyName('')
      await fetchKeys()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to generate a new key')
    } finally {
      setGenerating(false)
    }
  }

  async function revokeKey(apiKey: string) {
    const confirmed = window.confirm('Revoke this key now? Requests using it will stop working immediately.')
    if (!confirmed) {
      return
    }

    setRevoking(apiKey)
    setError(null)

    try {
      const response = await fetch('/api/keys/revoke', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to revoke key')
      }

      await fetchKeys()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to revoke key')
    } finally {
      setRevoking(null)
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(text)
      window.setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      setError('Clipboard access was blocked by the browser')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60" />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/60 bg-white/75 px-6 py-5 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30">
                <Key className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950">API Keys</h1>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Manage
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Generate, copy, and revoke gateway keys without leaving the dashboard.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-sky-300 hover:text-sky-700"
              >
                Back to dashboard
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                Gateway online
              </div>
            </div>
          </div>
        </header>

        <main className="mt-8 space-y-8">
          {error ? (
            <div className="rounded-[1.5rem] border border-rose-200/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600 ring-1 ring-rose-100">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">Action failed</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="rounded-full px-3 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

          {newKey ? (
            <section className="rounded-[2rem] border border-emerald-200/70 bg-emerald-50/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">New key generated</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-emerald-950">Copy it now. This is the only time the full key is visible.</h2>
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-white p-4 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-xl bg-slate-950 px-4 py-3 text-sm text-slate-100 shadow-inner">
                  {newKey.apiKey}
                </code>
                <button
                  type="button"
                  onClick={() => void copyToClipboard(newKey.apiKey)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  {copiedKey === newKey.apiKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedKey === newKey.apiKey ? 'Copied' : 'Copy key'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNewKey(null)}
                className="mt-4 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline"
              >
                I have stored this key
              </button>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Create key</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Generate a new API key</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Give the key a clear name so you can identify the tenant or project later.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(event) => setNewKeyName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void generateKey()
                    }
                  }}
                  placeholder="Company, project, or tenant name"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
                <button
                  type="button"
                  onClick={() => void generateKey()}
                  disabled={generating}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {generating ? 'Generating...' : 'Generate key'}
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Active keys</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">All API keys</h2>
              </div>
              <span className="text-sm font-medium text-slate-500">
                {keys.filter((key) => key.active).length} active, {keys.filter((key) => !key.active).length} revoked
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                <p className="text-sm text-slate-500">Loading keys...</p>
              </div>
            ) : keys.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Key className="h-8 w-8" />
                </div>
                <p className="text-lg font-semibold text-slate-900">No API keys yet</p>
                <p className="mt-2 text-sm text-slate-500">Generate your first key above to start using the gateway.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200/70">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">API key</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tenant</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {keys.map((key) => (
                      <tr key={key.apiKey} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-6 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-950">{key.name}</p>
                          <p className="mt-1 text-xs font-mono text-slate-400">{key.tenantId || 'Unknown tenant'}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            <code className="inline-flex max-w-full rounded-xl bg-slate-100 px-3 py-2 text-xs font-mono text-slate-700">
                              {key.maskedKey}
                            </code>
                            <button
                              type="button"
                              onClick={() => void copyToClipboard(key.apiKey)}
                              className="inline-flex items-center gap-1 text-left text-xs font-medium text-sky-700 hover:text-sky-800"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {copiedKey === key.apiKey ? 'Copied' : 'Copy full key'}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-600">
                          {key.tenantId}
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-600">
                          {key.createdAt ? new Date(key.createdAt).toLocaleString() : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                              key.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${key.active ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            />
                            {key.active ? 'Active' : 'Revoked'}
                          </span>
                          {!key.active && key.revokedAt ? (
                            <p className="mt-2 text-xs text-slate-400">Revoked {new Date(key.revokedAt).toLocaleString()}</p>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 align-top text-right">
                          {key.active ? (
                            <button
                              type="button"
                              onClick={() => void revokeKey(key.apiKey)}
                              disabled={revoking === key.apiKey}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {revoking === key.apiKey ? 'Revoking...' : 'Revoke'}
                            </button>
                          ) : (
                            <span className="text-sm text-slate-400">No actions</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}