'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateBrandingAction, uploadBrandingLogoAction, removeBrandingLogoAction } from '@/app/actions/branding'

interface Props {
  systemName: string | null
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
}

export default function BrandingSettingsForm({ systemName, logoUrl, primaryColor, secondaryColor }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(systemName ?? '')
  const [primary, setPrimary] = useState(primaryColor)
  const [secondary, setSecondary] = useState(secondaryColor)
  const [preview, setPreview] = useState(logoUrl)
  const [savingDetails, setSavingDetails] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [removingLogo, setRemovingLogo] = useState(false)

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault()
    setSavingDetails(true)
    try {
      await updateBrandingAction({ systemName: name, primaryColor: primary, secondaryColor: secondary })
      toast.success('Branding updated')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update branding')
    } finally {
      setSavingDetails(false)
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const url = await uploadBrandingLogoAction(formData)
      setPreview(url)
      toast.success('Logo updated')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload logo')
      setPreview(logoUrl)
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveLogo() {
    setRemovingLogo(true)
    try {
      await removeBrandingLogoAction()
      setPreview(null)
      toast.success('Logo removed')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove logo')
    } finally {
      setRemovingLogo(false)
    }
  }

  return (
    <form onSubmit={handleSaveDetails} className="space-y-8">
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Branding</h3>

        <div className="space-y-1.5">
          <Label htmlFor="systemName">System Name</Label>
          <Input
            id="systemName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kamay Aral"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted">
              {
                // eslint-disable-next-line @next/next/no-img-element -- preview can be a local blob: URL, which next/image can't optimize
                <img src={preview ?? '/kamay-aral-logo.png'} alt="Logo preview" className="h-12 w-12 object-contain" />
              }
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={uploadingLogo || removingLogo}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingLogo ? 'Uploading…' : 'Upload logo'}
            </Button>
            {preview && (
              <Button
                type="button"
                variant="outline"
                className="text-red-600 hover:text-red-700"
                disabled={uploadingLogo || removingLogo}
                onClick={handleRemoveLogo}
              >
                {removingLogo ? 'Removing…' : 'Remove logo'}
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Appearance</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="h-9 w-10 shrink-0 cursor-pointer rounded border"
              />
              <Input id="primaryColor" value={primary} onChange={(e) => setPrimary(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="h-9 w-10 shrink-0 cursor-pointer rounded border"
              />
              <Input id="secondaryColor" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={savingDetails}>
        {savingDetails ? 'Saving…' : 'Save Branding'}
      </Button>
    </form>
  )
}
