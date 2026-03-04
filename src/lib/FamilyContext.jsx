import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getFamily, getMembers } from './api'

const FamilyContext = createContext(null)

export function FamilyProvider({ children }) {
  const { user } = useAuth()
  const [family, setFamily] = useState(null)
  const [members, setMembers] = useState([])
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasFamily, setHasFamily] = useState(null)

  const loadFamily = useCallback(async () => {
    if (!user) {
      setFamily(null)
      setMembers([])
      setHasFamily(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data: familyData } = await getFamily(user.id)
      if (familyData) {
        setFamily(familyData)
        setHasFamily(true)
        const { data: membersData } = await getMembers(familyData.id)
        setMembers(membersData || [])
        if (!activeMemberId && membersData?.length) {
          setActiveMemberId(membersData[0].id)
        }
      } else {
        setHasFamily(false)
      }
    } catch (err) {
      console.error('Failed to load family:', err)
      setHasFamily(false)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadFamily()
  }, [loadFamily])

  const currentMember = members.find((m) => m.id === activeMemberId) || members[0]
  const parentMember = members.find((m) => m.role === 'parent')
  const childMembers = members.filter((m) => m.role === 'child')
  const isParent = currentMember?.role === 'parent'

  const value = {
    family,
    members,
    currentMember,
    parentMember,
    childMembers,
    activeMemberId,
    setActiveMemberId,
    isParent,
    loading,
    hasFamily,
    reload: loadFamily,
  }

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
}

export function useFamily() {
  const context = useContext(FamilyContext)
  if (!context) throw new Error('useFamily must be used within FamilyProvider')
  return context
}
