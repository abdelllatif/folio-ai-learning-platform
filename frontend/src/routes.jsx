import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PageLoader } from '@/components/ui'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { GuestOnly, RequireAuth } from '@/components/layout/guards'

const page = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })))

// public site
const Home = page(() => import('@/pages/public/Home'), 'Home')
const Features = page(() => import('@/pages/public/Features'), 'Features')
const Pricing = page(() => import('@/pages/public/Pricing'), 'Pricing')
const About = page(() => import('@/pages/public/About'), 'About')
const Faq = page(() => import('@/pages/public/Faq'), 'Faq')
const Contact = page(() => import('@/pages/public/Contact'), 'Contact')
const Terms = page(() => import('@/pages/public/Legal'), 'Terms')
const Privacy = page(() => import('@/pages/public/Legal'), 'Privacy')
const NotFound = page(() => import('@/pages/public/NotFound'), 'NotFound')

// auth
const Login = page(() => import('@/pages/auth/Login'), 'Login')
const Register = page(() => import('@/pages/auth/Register'), 'Register')
const ForgotPassword = page(() => import('@/pages/auth/PasswordReset'), 'ForgotPassword')
const ResetPassword = page(() => import('@/pages/auth/PasswordReset'), 'ResetPassword')

// student space
const Dashboard = page(() => import('@/pages/app/Dashboard'), 'Dashboard')
const Library = page(() => import('@/pages/app/Library'), 'Library')
const DocumentLayout = page(() => import('@/pages/app/document/DocumentLayout'), 'DocumentLayout')
const DocOverview = page(() => import('@/pages/app/document/Overview'), 'Overview')
const DocExplanation = page(() => import('@/pages/app/document/Explanation'), 'Explanation')
const DocEssentials = page(() => import('@/pages/app/document/Essentials'), 'Essentials')
const DocFaq = page(() => import('@/pages/app/document/DocFaq'), 'DocFaq')
const DocAssistant = page(() => import('@/pages/app/document/DocAssistant'), 'DocAssistant')
const DocQuizzes = page(() => import('@/pages/app/document/DocQuizzes'), 'DocQuizzes')
const DocFlashcards = page(() => import('@/pages/app/document/DocFlashcards'), 'DocFlashcards')
const DocNotes = page(() => import('@/pages/app/document/DocNotes'), 'DocNotes')
const DocText = page(() => import('@/pages/app/document/DocText'), 'DocText')
const Assistant = page(() => import('@/pages/app/Assistant'), 'Assistant')
const Quizzes = page(() => import('@/pages/app/quiz/Quizzes'), 'Quizzes')
const QuizPlay = page(() => import('@/pages/app/quiz/QuizPlay'), 'QuizPlay')
const AttemptReview = page(() => import('@/pages/app/quiz/AttemptReview'), 'AttemptReview')
const Decks = page(() => import('@/pages/app/flashcards/Decks'), 'Decks')
const DeckDetail = page(() => import('@/pages/app/flashcards/DeckDetail'), 'DeckDetail')
const Review = page(() => import('@/pages/app/flashcards/Review'), 'Review')
const Notes = page(() => import('@/pages/app/Notes'), 'Notes')
const Planner = page(() => import('@/pages/app/planner/Planner'), 'Planner')
const ExamPlan = page(() => import('@/pages/app/planner/ExamPlan'), 'ExamPlan')
const Focus = page(() => import('@/pages/app/Focus'), 'Focus')
const Progress = page(() => import('@/pages/app/Progress'), 'Progress')
const Settings = page(() => import('@/pages/app/Settings'), 'Settings')
const Billing = page(() => import('@/pages/app/Billing'), 'Billing')
const Help = page(() => import('@/pages/app/Help'), 'Help')

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="fonctionnalites" element={<Features />} />
          <Route path="tarifs" element={<Pricing />} />
          <Route path="a-propos" element={<About />} />
          <Route path="faq" element={<Faq />} />
          <Route path="contact" element={<Contact />} />
          <Route path="conditions" element={<Terms />} />
          <Route path="confidentialite" element={<Privacy />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route element={<GuestOnly />}>
            <Route path="connexion" element={<Login />} />
            <Route path="inscription" element={<Register />} />
            <Route path="mot-de-passe-oublie" element={<ForgotPassword />} />
          </Route>
          <Route path="reinitialiser" element={<ResetPassword />} />
        </Route>

        <Route path="app" element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="bibliotheque" element={<Library />} />
            <Route path="documents/:id" element={<DocumentLayout />}>
              <Route index element={<DocOverview />} />
              <Route path="explication" element={<DocExplanation />} />
              <Route path="essentiel" element={<DocEssentials />} />
              <Route path="faq" element={<DocFaq />} />
              <Route path="assistant" element={<DocAssistant />} />
              <Route path="quiz" element={<DocQuizzes />} />
              <Route path="fiches" element={<DocFlashcards />} />
              <Route path="notes" element={<DocNotes />} />
              <Route path="texte" element={<DocText />} />
            </Route>
            <Route path="assistant" element={<Assistant />} />
            <Route path="quiz" element={<Quizzes />} />
            <Route path="quiz/:id" element={<QuizPlay />} />
            <Route path="tentatives/:id" element={<AttemptReview />} />
            <Route path="fiches" element={<Decks />} />
            <Route path="fiches/revision" element={<Review />} />
            <Route path="fiches/:id" element={<DeckDetail />} />
            <Route path="fiches/:id/revision" element={<Review />} />
            <Route path="notes" element={<Notes />} />
            <Route path="planning" element={<Planner />} />
            <Route path="planning/examens/:id" element={<ExamPlan />} />
            <Route path="concentration" element={<Focus />} />
            <Route path="progression" element={<Progress />} />
            <Route path="parametres" element={<Settings />} />
            <Route path="abonnement" element={<Billing />} />
            <Route path="aide" element={<Help />} />
            <Route path="*" element={<NotFound inApp />} />
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
