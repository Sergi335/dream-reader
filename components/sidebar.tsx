import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConversations } from '@/context/conversations-context'
import useChatMessages from '@/hooks/useChatMessages'
// import useChatMessages from '@/hooks/useChatMessages'
// import { useChatState } from '@/hooks/useChatState'
import { cn } from '@/lib/utils'
import { SignOutButton, useUser } from '@clerk/nextjs'
import { LogOut, Plus, Trash2, User, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { forwardRef, useCallback, useState } from 'react'

interface SidebarProps {
  setError: (error: string) => void;
}

export const Sidebar = forwardRef<HTMLInputElement, SidebarProps>(
  ({ setError }, inputRef) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user } = useUser()
    const t = useTranslations()
    // const { signOut } = useClerk()

    const {
      conversations,
      activeConversationId,
      setActiveConversationId,
      createConversation,
      deleteConversation,
      isLoading
    } = useConversations()
    // console.log('🚀 ~ conversations:', conversations)
    const { resetToInitialChat } = useChatMessages()

    const handleNewConversation = useCallback(async () => {
      // Busca una conversación vacía
      const emptyConversation = conversations.find(c => c.messages.length === 0)
      console.log('🚀 ~ emptyConversation:', emptyConversation)
      if (emptyConversation) {
        setActiveConversationId(emptyConversation.id)
        resetToInitialChat()
        setSidebarOpen(false)
        setError('')
        setTimeout(() => {
          if (inputRef && 'current' in inputRef && inputRef.current) {
            inputRef.current.focus()
          }
        }, 100)
        return
      }

      // Si no existe, crea una nueva
      try {
        const newConversationId = await createConversation('Nueva conversación')
        if (newConversationId) {
          setActiveConversationId(newConversationId)
        }
        setSidebarOpen(false)
        setError('')
        setTimeout(() => {
          if (inputRef && 'current' in inputRef && inputRef.current) {
            inputRef.current.focus()
          }
        }, 100)
      } catch (error) {
        console.error('Error creating conversation:', error)
        setError('Error al crear nueva conversación')
      }
    }, [conversations, createConversation, setActiveConversationId, setError, inputRef, resetToInitialChat])

    const handleDeleteConversation = useCallback(async (conversationId: string, e: React.MouseEvent) => {
      e.stopPropagation() // Evitar que se seleccione la conversación al hacer click en eliminar

      try {
        await deleteConversation(conversationId)

        // Si la conversación eliminada era la activa, cambiar a la primera disponible
        if (conversationId === activeConversationId) {
          const remainingConversations = conversations.filter(c => c.id !== conversationId)
          if (remainingConversations.length > 0) {
            setActiveConversationId(remainingConversations[0].id)
          } else {
            setActiveConversationId(null)
          }
        }

        setError('')
      } catch (error) {
        console.error('Error deleting conversation:', error)
        setError('Error al eliminar la conversación')
      }
    }, [deleteConversation, activeConversationId, conversations, setActiveConversationId, setError])

    return (
      <div className={cn(
        'flex flex-col w-64 border-r border-gray-700 transition-all duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 min-h-20">
          <h1 className="text-xl font-bold">Dream Reader</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New conversation button */}
        <div className="p-4">
          <Button
            onClick={handleNewConversation}
            className="w-full bg-accent hover:bg-gray-700 border border-gray-600"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('newConversation')}
          </Button>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              conversation.messages.length > 0 && (
                <div key={conversation.id} className="relative">
                  <Button
                    variant={conversation.id === activeConversationId ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-left h-auto p-3 group hover:bg-secondary"
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <div className="flex-1 truncate">
                      <div className="font-medium truncate max-w-32">
                        {conversation.title || t('untitled') || 'Sin título'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {conversation.messages.length} mensajes
                      </div>
                    </div>
                    <Trash2 onClick={(e) => handleDeleteConversation(conversation.id, e)} className="h-4 w-4 group-hover:block hidden hover:text-red-400" />
                  </Button>
                </div>
              )))}
          </div>
        </ScrollArea>

        {/* User info and settings */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
            <SignOutButton redirectUrl="/es">
              <button><LogOut className="h-4 w-4" /></button>
            </SignOutButton>
          </div>
        </div>
      </div>
    )
  }
)

Sidebar.displayName = 'Sidebar'
