'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/contexts/auth-context'
import { changeEmail, changePassword } from '@/lib/nhost/auth'
import { nhost } from '@/lib/nhost/client'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, User, Lock, Trash2, Mail } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const t = useTranslations('pages.settings')
  
  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  
  // Email change state
  const [newEmail, setNewEmail] = useState('')
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Account deletion state
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Update display name (simplified - just show info for now)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.info('Display name updates will be available soon')
    // TODO: Implement display name update via GraphQL mutation
  }

  // Change email
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newEmail) {
      toast.error('Please enter a new email address')
      return
    }

    setIsChangingEmail(true)

    try {
      await changeEmail(newEmail)
      toast.success('Verification email sent! Please check your new email address.')
      setNewEmail('')
    } catch (error) {
      toast.error('Failed to change email')
      console.error('Email change error:', error)
    } finally {
      setIsChangingEmail(false)
    }
  }

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsChangingPassword(true)

    try {
      await changePassword(newPassword)
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error('Failed to change password')
      console.error('Password change error:', error)
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    if (!deletePassword) {
      toast.error('Please enter your password')
      return
    }

    setIsDeleting(true)

    try {
      // Re-authenticate before deletion
      const loginResponse = await nhost.auth.signInEmailPassword({
        email: user?.email || '',
        password: deletePassword,
      })

      if (loginResponse.status !== 200 || !loginResponse.body.session) {
        throw new Error('Invalid password')
      }

      // For now, just sign out (actual deletion would need backend function)
      // TODO: Implement actual account deletion via Nhost function or GraphQL
      toast.info('Account deletion will be available soon. For now, we\'ll sign you out.')
      
      setShowDeleteDialog(false)
      
      // Sign out
      await nhost.auth.signOut({})
      router.push('/auth/login')
    } catch (error) {
      toast.error('Failed to delete account. Please check your password.')
      console.error('Account deletion error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t('pleaseLogIn')}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('managePreferences')}
        </p>
      </div>

      <Separator />

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('profile.titleShort')}
          </CardTitle>
          <CardDescription>
            {t('profile.updateInfo')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                {t('profile.emailCannotChange')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">{t('profile.displayName')}</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('profile.displayNamePlaceholder')}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('profile.updateButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Email Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('email.titleShort')}
          </CardTitle>
          <CardDescription>
            {t('email.changeDescription')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleChangeEmail}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentEmail">{t('email.currentEmail')}</Label>
              <Input
                id="currentEmail"
                type="email"
                value={user.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">{t('email.newEmail')}</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('email.newEmailPlaceholder')}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isChangingEmail || !newEmail}>
              {isChangingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('email.changeButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('password.titleShort')}
          </CardTitle>
          <CardDescription>
            {t('password.changeDescription')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('password.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('password.newPasswordPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('password.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('password.confirmPasswordPlaceholder')}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isChangingPassword || !newPassword || !confirmPassword}>
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('password.changeButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Danger Zone - Account Deletion */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t('deleteAccount.titleShort')}
          </CardTitle>
          <CardDescription>
            {t('deleteAccount.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('deleteAccount.warningDescription')}
          </p>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                {t('deleteAccount.button')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('deleteAccount.dialog.title')}</DialogTitle>
                <DialogDescription>
                  {t('deleteAccount.dialog.description')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="deleteConfirmation">
                    {t('deleteAccount.dialog.confirmLabel')}
                  </Label>
                  <Input
                    id="deleteConfirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={t('deleteAccount.dialog.confirmPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deletePassword">
                    {t('deleteAccount.dialog.passwordLabel')}
                  </Label>
                  <Input
                    id="deletePassword"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder={t('deleteAccount.dialog.passwordPlaceholder')}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  {t('deleteAccount.dialog.cancelButton')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmation !== 'DELETE' || !deletePassword}
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('deleteAccount.dialog.confirmButton')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}

