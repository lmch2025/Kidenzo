'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface WithdrawalRequest {
  id: string
  userId: string
  amount: number
  phoneNumber: string
  paymentMethod: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  createdAt: string
  user: {
    name: string | null
    phone: string
    role: string
  }
}

export function AdminWithdrawals() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/withdrawals' 
        : `/api/admin/withdrawals?status=${statusFilter}`
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (res.ok && data.withdrawals) {
        setRequests(data.withdrawals)
      } else {
        toast.error('Erreur de chargement des retraits')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [statusFilter])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Voulez-vous vraiment changer le statut en ${newStatus} ?`)) return

    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })

      if (res.ok) {
        toast.success(`Statut mis à jour : ${newStatus}`)
        fetchWithdrawals()
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur serveur')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>
      case 'approved': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approuvé</Badge>
      case 'paid': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Payé</Badge>
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Refusé</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Demandes de Retrait</h2>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvé</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
              <SelectItem value="rejected">Refusé</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchWithdrawals} variant="outline" size="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des demandes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune demande trouvée.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Mobile Money</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleDateString()}
                        <div className="text-xs text-muted-foreground">
                          {new Date(req.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{req.user.name || 'Anonyme'}</div>
                        <div className="text-xs text-muted-foreground">{req.user.phone} ({req.user.role})</div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {req.amount.toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {req.phoneNumber}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => handleUpdateStatus(req.id, 'paid')} className="bg-green-600 hover:bg-green-700">
                              Payer
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(req.id, 'rejected')}>
                              Refuser
                            </Button>
                          </div>
                        )}
                        {req.status === 'paid' && (
                          <span className="text-xs text-muted-foreground">Terminé</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
