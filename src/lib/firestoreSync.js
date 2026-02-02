import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'

const APP_DOC = 'controlcentre'
const PROTOCOL_FILES = 'protocolFiles'

export async function loadStateFromFirestore() {
  try {
    const appRef = doc(db, 'app', APP_DOC)
    const appSnap = await getDoc(appRef)
    if (!appSnap.exists()) return null

    const data = appSnap.data()
    const projects = (data.projects ?? []).map((p) => ({
      ...p,
      githubRepo: p.githubRepo ?? '',
    }))
    const tasks = data.tasks ?? {}
    const protocols = data.protocols ?? []

    const filesSnap = await getDocs(collection(db, PROTOCOL_FILES))
    const protocolFiles = {}
    filesSnap.docs.forEach((d) => {
      protocolFiles[d.id] = d.data()
    })

    return { projects, tasks, protocols, protocolFiles }
  } catch (e) {
    console.warn('Firestore load failed', e)
    return null
  }
}

export async function saveStateToFirestore(state) {
  try {
    const appRef = doc(db, 'app', APP_DOC)
    await setDoc(appRef, {
      projects: state.projects ?? [],
      tasks: state.tasks ?? {},
      protocols: state.protocols ?? [],
    }, { merge: true })

    const existingFiles = new Set()
    const filesRef = collection(db, PROTOCOL_FILES)
    const filesSnap = await getDocs(filesRef)
    filesSnap.docs.forEach((d) => existingFiles.add(d.id))

    const batch = writeBatch(db)
    const currentFileIds = new Set()
    for (const fid of Object.keys(state.protocolFiles ?? {})) {
      currentFileIds.add(fid)
      const f = state.protocolFiles[fid]
      batch.set(doc(db, PROTOCOL_FILES, fid), {
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        dataUrl: f.dataUrl,
      })
    }
    for (const fid of existingFiles) {
      if (!currentFileIds.has(fid)) {
        batch.delete(doc(db, PROTOCOL_FILES, fid))
      }
    }
    await batch.commit()
  } catch (e) {
    console.warn('Firestore save failed', e)
  }
}

export function subscribeToFirestore(onState) {
  const appRef = doc(db, 'app', APP_DOC)
  return onSnapshot(appRef, async (snap) => {
    if (!snap.exists()) return
    const data = snap.data()
    const projects = (data.projects ?? []).map((p) => ({
      ...p,
      githubRepo: p.githubRepo ?? '',
    }))
    const tasks = data.tasks ?? {}
    const protocols = data.protocols ?? []

    const filesSnap = await getDocs(collection(db, PROTOCOL_FILES))
    const protocolFiles = {}
    filesSnap.docs.forEach((d) => {
      protocolFiles[d.id] = d.data()
    })

    onState({ projects, tasks, protocols, protocolFiles })
  }, (e) => console.warn('Firestore subscribe error', e))
}
