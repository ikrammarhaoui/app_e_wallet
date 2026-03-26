import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid, getCardByNum, isCardExpired } from "../Model/database.js";
const user = JSON.parse(sessionStorage.getItem("currentUser"));
// DOM elements
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");
const transferBtn = document.getElementById("quickTransfer");
const transferSection = document.getElementById("transferPopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");
const submitTransferBtn=document.getElementById("submitTransferBtn");
//
const topupSection    = document.getElementById("topupPopup");      // ton popup a id="topupPopup"
const topupCardSelect = document.getElementById("topupCard");       // ton select a id="topupCard"
const submitTopupBtn  = document.getElementById("submitTopupBtn");
const closeTopupBtn   = document.getElementById("closeTopupBtn");
const cancelTopupBtn  = document.getElementById("cancelTopupBtn");
const topupMessage    = document.getElementById("rechargerMessage"); // tu n'as pas cet élément dans HTML, tu peux créer un <p id="rechargerMessage"></p> dans le popup
const topupBtn = document.getElementById("quickTopup"); 
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
  transferBtn.addEventListener("click", handleTransfersection);
  closeTransferBtn.addEventListener("click", closeTransfer);
  cancelTransferBtn.addEventListener("click", closeTransfer);
  submitTransferBtn.addEventListener("click",handleTransfer)


  //
topupBtn.addEventListener("click", handleTopupSection);
closeTopupBtn.addEventListener("click", closeTopup);
cancelTopupBtn.addEventListener("click", closeTopup);
submitTopupBtn.addEventListener("click", handleTopup);

// Retrieve dashboard data
const getDashboardData = () => {
  const monthlyIncome = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  return {
    userName: user.name,
    currentDate: new Date().toLocaleDateString("fr-FR"),
    availableBalance: `${user.wallet.balance} ${user.wallet.currency}`,
    activeCards: user.wallet.cards.length,
    monthlyIncome: `${monthlyIncome} MAD`,
    monthlyExpenses: `${monthlyExpenses} MAD`,
  };
};

function renderDashboard(){
const dashboardData = getDashboardData();
if (dashboardData) {
  greetingName.textContent = dashboardData.userName;
  currentDate.textContent = dashboardData.currentDate;
  solde.textContent = dashboardData.availableBalance;
  incomeElement.textContent = dashboardData.monthlyIncome;
  expensesElement.textContent = dashboardData.monthlyExpenses;
  activecards.textContent = dashboardData.activeCards;
}
// Display transactions
transactionsList.innerHTML = "";
user.wallet.transactions.forEach(transaction => {
  const transactionItem = document.createElement("div");
  transactionItem.className = "transaction-item";
  transactionItem.innerHTML = `
    <div>${transaction.date}</div>
    <div>${transaction.amount} MAD</div>
    <div>${transaction.type}</div>
  `;
  transactionsList.appendChild(transactionItem);
});

}
renderDashboard();

// Transfer popup
function closeTransfer() {
  transferSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}
//recharge popup
function closeTopup() {
  topupSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}
//trans
function handleTransfersection() {
  transferSection.classList.add("active");
  document.body.classList.add("popup-open");
}
//recharge
function handleTopupSection() {
  topupSection.classList.add("active");
  document.body.classList.add("popup-open");
  renderTopupCards(); // remplir le select des cartes
}
// Beneficiaries
const beneficiaries = getbeneficiaries(user.id);

function renderBeneficiaries() {
  beneficiaries.forEach((beneficiary) => {
    const option = document.createElement("option");
    option.value = beneficiary.id;
    option.textContent = beneficiary.name;
    beneficiarySelect.appendChild(option);
  });
}
renderBeneficiaries();
//trans
function renderCards() {
  user.wallet.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type+"****"+card.numcards;
    sourceCard.appendChild(option);
  });
}
renderCards();
//recharge 
function renderTopupCards() {
  topupCardSelect.innerHTML = ''; // vide juste le select réel
  user.wallet.cards.forEach(card => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = `${card.type.toUpperCase()} **** ${card.numcards.slice(-4)}`;
    topupCardSelect.appendChild(option);
  });
}
renderTopupCards();
//###################################  Transfer  #####################################################//

// check function 

/* function checkUser(numcompte, callback) {
  setTimeout(() => {
    const destinataire = finduserbyaccount(numcompte);
    if (destinataire) {
      callback(destinataire);
    } else {
      console.log("Destinataire non trouvé");
    }
  }, 500);
}

function checkSolde(exp, amount, callback) {
  setTimeout(() => {
    const solde = exp.wallet.balance;
    if (solde >= amount) {
      callback("Solde suffisant");
    } else {
      callback("Solde insuffisant");
    }
  }, 400);
}

function updateSolde(exp, destinataire, amount, callback) {
  setTimeout(() => {  
    exp.wallet.balance -= amount;
    destinataire.wallet.balance += amount;
    callback("Solde mis à jour");
  }, 300);
}


function addtransactions(exp, destinataire, amount, callback) {
  setTimeout(() => { 
    // Transaction pour l'expéditeur (débit)
    const transactionDebit = {
      id: Date.now(),
      type: "debit",
      amount: amount,
      from: exp.name,
      to: destinataire.name,
      date: new Date().toLocaleDateString()
    };

    // Transaction pour le destinataire (crédit)
    const transactionCredit = {
      id: Date.now() + 1,
      type: "credit",
      amount: amount,
      from: exp.name,
      to: destinataire.name,
      date: new Date().toLocaleDateString()
    };

    user.wallet.transactions.push(transactionDebit);
    destinataire.wallet.transactions.push(transactionCredit);
    renderDashboard();
    callback("Transaction enregistrée");
  }, 200);
}


export function transferer(exp, numcompte, amount) {
  console.log("\n DÉBUT DU TRANSFERT ");

  // Étape 1: Vérifier le destinataire
  checkUser(numcompte, function afterCheckUser(destinataire) {
    console.log("Étape 1: Destinataire trouvé -", destinataire.name);

    // Étape 2: Vérifier le solde
    checkSolde(exp, amount, function afterCheckSolde(soldemessage) {
      console.log(" Étape 2:", soldemessage);

      if (soldemessage.includes("Solde suffisant")) {
        // Étape 3: Mettre à jour les soldes
        updateSolde(exp, destinataire, amount, function afterUpdateSolde(updatemessage) {
          console.log(" Étape 3:", updatemessage);

          // Étape 4: Enregistrer la transaction
          addtransactions(exp, destinataire, amount, function afterAddTransactions(transactionMessage) {
            console.log(" Étape 4:", transactionMessage);
            console.log(`Transfert de ${amount} réussi!`);
          });
        });
      }
    });
  });
}


function handleTransfer(e) {
 e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const beneficiaryAccount=findbeneficiarieByid(user.id,beneficiaryId).account;
  const sourceCard = document.getElementById("sourceCard").value;

  const amount = Number(document.getElementById("amount").value);

  
  transferer(user, beneficiaryAccount, amount);

} */

function checkUser(numcompte){
  return new Promise((resolve,reject) => {
     setTimeout(()=>{
     const beneficiary=finduserbyaccount(numcompte);
     if(beneficiary){
        resolve(beneficiary);
     }
     else{
        reject("beneficiary not found");
     }
     },2000);
} );}


function checkSolde(expediteur,amount){
  return new Promise((resolve, reject) => {
  setTimeout(()=>{
      if(expediteur.wallet.balance>amount){
        resolve("Sufficient balance");
      }else{
        reject("Insufficient balance");
      }
  },3000)
});}

function updateSolde(expediteur,destinataire,amount){
  return new Promise((resolve) => {
    setTimeout(()=>{
        expediteur.wallet.balance-=amount;
        destinataire.wallet.balance+=amount;
        resolve("update balance done");
  },200);
});}

function addtransactions(expediteur,destinataire,amount){
  return new Promise((resolve) => {
   setTimeout(()=>{
    // create credit transaction
 const credit={
    id:Date.now(),
    type:"credit",
    amount: amount,
    date: Date.now().toLocaleString(),
    from: expediteur.name
 }
 //create debit transaction
const debit={
    id:Date.now(),
    type:"debit",
    amount: amount,
    date: Date.now().toLocaleString(),
    to: destinataire.name, 
 }
  expediteur.wallet.transactions.push(debit);
  destinataire.wallet.transactions.push(credit);
   resolve("transaction added successfully");
   },3000)
});}

// **************************************transfer***************************************************//
function transfer(expediteur, numcompte, amount) {
  checkUser(numcompte) // p0
    .then(destinataire => { //p1
      console.log("Étape 1: Beneficiary found -", destinataire.name);
      return  checkSolde(expediteur, amount) //p2
      .then(() => destinataire); //p3
    })
    .then(destinataire => { //P4
      console.log("Étape 2: Sufficient balance");
      return updateSolde(expediteur, destinataire, amount) //P5
        .then(() => destinataire); //P6
    })
    .then(destinataire => {
      console.log("Étape 3: update balance done");
      return addtransactions(expediteur, destinataire, amount);
    })
    .then(message => {
      console.log("Étape 4:", message);
      renderDashboard();
      closeTransfer();
    })
    .catch(error => {
      console.log("Erreur lors du transfert :", error.message);
    });
}

function handleTransfer(e) {
 e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const beneficiaryAccount=findbeneficiarieByid(user.id,beneficiaryId).account;
  const sourceCard = document.getElementById("sourceCard").value;

  const amount = Number(document.getElementById("amount").value);

transfer(user, beneficiaryAccount, amount);

} 


//****************************Recharge********************************** */
function verifierAmount(amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!amount  || amount <= 0) {
        // AJOUT : rejet si montant absent, non numérique ou négatif/nul
        reject("Le montant doit être > 0.");
      } else if (amount < 10) {
        // AJOUT : rejet si en dessous du minimum autorisé (10 MAD)
        reject("Le montant min est 10 MAD.");
      } else if (amount > 5000) {
        // AJOUT : rejet si au dessus du maximum autorisé (5 000 MAD)
        // CORRECTION : l'ancienne condition était (amount < 10 && amount > 5000),
        //              logiquement impossible — corrigée en deux blocs distincts
        reject("Le montant max est 5000 MAD.");
      } else {
        resolve(amount); 
      }
    }, 300);
  });
}


function updateWalletBalance(amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      user.wallet.balance += amount; 
      resolve("changement de solde effectué");
    }, 400);
  });
}


function addRechargeTransaction(amount, card) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const transaction = {
        id:     String(Date.now()),
        type:   "recharge",                                                    // AJOUT : nouveau type de transaction
        amount: amount,
        date:   new Date().toLocaleDateString("fr-FR"),
        from:   `${card.type.toUpperCase()} **** ${card.numcards.slice(-4)}`,  // AJOUT : source = carte masquée
        to:     user.account                                                    // AJOUT : destination = wallet de l'utilisateur
      };
      user.wallet.transactions.push(transaction); // AJOUT : ajout à l'historique de l'utilisateur
      resolve("Transaction RECHARGE enregistrée.");
    }, 300);
  });
}


function validateCard(userId, numcard) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const card = user.wallet.cards.find(c => c.numcards === numcard);
      if (card) {
        resolve(card);
      } else {
        reject(new Error("Carte invalide ou non trouvée"));
      }
    }, 300);
  });
}
function recharger(userId, numcard, amount) {
  let validatedCard = user.wallet.cards.find(c => c.numcards === numcard);
  if (!validatedCard) {
      topupMessage.textContent = "Carte invalide !";
      return;
  }

  submitTopupBtn.disabled    = true;
  submitTopupBtn.textContent = "Traitement...";
    verifierAmount(amount)

    .then(verifierAmount => {
      console.log("Étape 2 : Montant valide ", verifierAmount, "MAD");
      return updateWalletBalance(verifierAmount); 
    })
    .then(msg => {
      console.log("Étape 3 :", msg);
      return addRechargeTransaction(amount, validatedCard); 
    })
    .then(msg => {
      console.log("Étape 4 :", msg);
      topupMessage.textContent = ` Rechargement de ${amount} MAD effectué avec succès !`;
      topupMessage.className   = "recharger-message success"; 
      renderDashboard();                    
      setTimeout(() => closeTopup(), 2000); 
    })
    .catch(error => {
  console.log("Erreur lors du transfert :", error);
});

    
}

function handleTopup(e) {
  e.preventDefault();
  topupMessage.textContent = "";     
  topupMessage.className   = "recharger-message"; 
  const numcard = topupCardSelect.value;
const amount = Number(document.getElementById("topupAmount").value);
  recharger(user.id, numcard, amount);
}
