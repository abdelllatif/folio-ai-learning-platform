/** Shared by the public FAQ and the in-app help centre. */
export const FAQ = [
  {
    group: 'Démarrer',
    items: [
      { q: 'Quels documents puis-je déposer ?', a: 'Des fichiers PDF : cours, polycopiés, TD, TP, annales, articles ou chapitres de livres. Les PDF scannés (photos de pages) sont lus par reconnaissance de texte (OCR). Les fichiers Word ou PowerPoint doivent d’abord être exportés en PDF.' },
      { q: 'Combien de temps dure l’analyse ?', a: 'Généralement une à trois minutes pour un cours de 30 pages. Un PDF scanné ou très long peut prendre plus de temps. Vous pouvez quitter la page : l’analyse continue et le document passe à « Prêt » quand elle est terminée.' },
      { q: 'Dans quelles langues fonctionne Folio ?', a: 'Français, anglais et arabe. La langue du document est détectée automatiquement et le résumé, les quiz et les réponses sont rédigés dans cette langue.' },
      { q: 'Mon analyse a échoué, que faire ?', a: 'Le message d’erreur indique la cause : PDF protégé par mot de passe, fichier sans texte, page illisible. Corrigez le fichier puis utilisez « Relancer l’analyse » depuis le document.' },
    ],
  },
  {
    group: 'L’assistant et les sources',
    items: [
      { q: 'D’où viennent les réponses de l’assistant ?', a: 'Uniquement du document ouvert. Folio retrouve les passages les plus proches de votre question, puis rédige une réponse à partir de ces passages seulement. Chaque affirmation porte un numéro [1], [2]… qui renvoie au passage et à sa page.' },
      { q: 'Pourquoi l’assistant répond-il « Je ne trouve pas cette information » ?', a: 'Parce que le document ne traite pas votre question, ou pas avec ces mots. C’est voulu : Folio préfère ne pas répondre plutôt qu’inventer. Reformulez avec les termes du cours, ou vérifiez que vous êtes dans le bon document.' },
      { q: 'Que signifie le badge « Mode extraits » ?', a: 'Le modèle de langage est momentanément indisponible. Folio continue de fonctionner en vous montrant directement les passages pertinents du document, et en générant résumés et quiz à partir de phrases du cours.' },
    ],
  },
  {
    group: 'Quiz et fiches',
    items: [
      { q: 'Comment sont créés les quiz ?', a: 'À partir de passages répartis sur tout le document, ou sur un thème que vous précisez. Chaque question indique la page source et l’explication de la bonne réponse apparaît après votre tentative.' },
      { q: 'Qu’est-ce que la répétition espacée ?', a: 'Une méthode qui vous remontre une fiche juste avant que vous ne l’oubliiez. Si vous répondez « Facile », la fiche revient dans plusieurs jours ; « À revoir », elle revient dans dix minutes. Une fiche est « maîtrisée » quand son intervalle dépasse 21 jours.' },
      { q: 'Puis-je créer mes propres fiches ?', a: 'Oui. Créez un paquet vide depuis « Fiches de révision » ou ajoutez des fiches à un paquet généré.' },
    ],
  },
  {
    group: 'Compte, offres et données',
    items: [
      { q: 'Folio est-il gratuit ?', a: 'Oui, l’offre gratuite inclut 15 documents de 25 Mo maximum avec toutes les fonctionnalités. L’offre Étudiant Pro lève la limite de documents et accepte des fichiers jusqu’à 100 Mo.' },
      { q: 'Mes documents servent-ils à entraîner une IA ?', a: 'Non. Vos documents ne sont utilisés que pour votre compte. Les modèles tournent sur nos serveurs et ne sont pas réentraînés avec vos fichiers.' },
      { q: 'Qui peut voir mes documents ?', a: 'Vous seul. Chaque document, conversation, note et quiz est lié à votre compte et inaccessible aux autres utilisateurs.' },
      { q: 'Comment supprimer mon compte ?', a: 'Dans Paramètres › Compte. La suppression efface définitivement vos documents, conversations, quiz, fiches et notes.' },
      { q: 'Proposez-vous une offre pour les écoles ?', a: 'Oui : l’offre Établissement équipe une classe ou un campus avec des comptes Pro et un suivi d’usage. Écrivez-nous depuis la page Contact en choisissant « Offre établissement ».' },
    ],
  },
]
