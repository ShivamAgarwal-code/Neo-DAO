// This module contains some helpful utility code used
//  in NEO N3 smart contract work.
using System;
// using System.ComponentModel;
using System.Numerics;
using Neo;
using Neo.SmartContract.Framework;
// using Neo.SmartContract.Framework.Attributes;
// using Neo.SmartContract.Framework.Native;
using Neo.SmartContract.Framework.Services;
using System.ComponentModel;
using Neo.SmartContract;
using Neo.SmartContract.Framework.Attributes;
using Neo.SmartContract.Framework.Native;

#nullable enable

namespace AndroidTechnologies
{

    /// <summary>
    /// This class makes it easier to perform certain validity
    ///  checks on the current payment context.
    /// </summary>
    public class PaymentSecurityContext
    {
        /// <summary>
        /// Constructor.  
        /// </summary>
        public PaymentSecurityContext()
        {
            // Get a reference to the transaction data.
            this.Tx = (Transaction) Runtime.ScriptContainer;

            this.CallingScriptHash = Runtime.CallingScriptHash;
            this.ExecutingScriptHash = Runtime.ExecutingScriptHash;
            this.Sender = this.Tx.Sender;
        }

        // These variables just make it easier to acces the values
        //  of the same name from the current transaction object.
        
        public Transaction Tx = default!;
        public UInt160 ExecutingScriptHash = default!;

        public UInt160 CallingScriptHash = default!;


        public UInt160 Sender = default!;

        /// <summary>
        /// Executes a basic authentication of the transaction sender.
        ///  Throws an exception if the sender did not sign the
        ///  current transaction.  Just exits if they did.
        /// </summary>
        /// <param name="callingMethod" - The method
        ///  that called this method, for error reporting
        ///  purposes. </param>
        public void CheckSender(string callingMethod)
        {
            MyUtilities.DoBasicCheckWitnessChecK(callingMethod);
        }

        /// <summary>
        /// This function that at least the minimum amount of tokens
        ///  was received from the desired token contract.  If those
        ///  conditions are not met, an exception is thrown.  Otherwise
        ///  the method just returns.
        /// </summary>
        /// <param name="minimumAmountReceived">The minimum amount
        ///  of tokens we should have received.</param>
        /// <param name="receivedFromContractHash">The contract hash of the
        ///  required token contract.</param>
        public void ValidateFundsReceived(BigInteger minimumAmountReceived, UInt160 receivedFromContractHash) {
            if (0 > minimumAmountReceived)
                throw new Exception($"({nameof(ValidateFundsReceived)}) The minimumAmountReceived is negative.");
            if (0 == minimumAmountReceived)
                throw new Exception($"({nameof(ValidateFundsReceived)}) The minimumAmountReceived is zero.");

            string receivedFromName = MyUtilities.TokenContractHashToSymbol(receivedFromContractHash);

            if (this.CallingScriptHash != receivedFromContractHash)
                throw new Exception($"({nameof(ValidateFundsReceived)}) The amount received was not received from the {receivedFromName} contract.");
        }

    }

    public static class MyUtilities
    {
        // The prefix to use for the contract owner field when
        //  stored in a StorageMap object.
        const string FIELD_NAME_CONTRACT_OWNER = "contract_owner::";

        /// <summary>
        /// Convert a token contract hash to its asset symbol.
        /// </summary>
        /// <param name="tokenContractHash">The hash value of the token contract.</param>
        public static string TokenContractHashToSymbol(UInt160 tokenContractHash)
        {
            if (MyUtilities.IsEmptyOrInvalidUInt160(tokenContractHash))
                throw new Exception($"({nameof(TokenContractHashToSymbol)}) The tokenContractHash is empty.");

            if (GAS.Hash.Equals(tokenContractHash))
                return ("GAS");
            else if (NEO.Hash.Equals(tokenContractHash))
                return ("NEO");
            else
                return ("UNKNOWN TOKEN CONTRACT HASH");
        }

        /// <summary>
        /// Simple function to both log and then throw and Exception
        ///     using the given error message.
        /// </summary>
        /// <param name="errMsg">An error message.</param>
        public static void ReportErrorAndThrow(string errMsg)
        {
            Runtime.Log(errMsg);
            throw new Exception(errMsg);
        }

        /// <summary>
        /// Simple function to both log an error message.
        /// </summary>
        /// <param name="errMsg">An error message.</param>
        public static void ReportError(string errMsg)
        {
            Runtime.Log(errMsg);
        }

        /// <summary>
        /// Returns the time that should be used as the "current" time for all date/tim
        ///     calculations done by code in this smart contract.
        ///     
        /// NOTE: The time may be a few seconds beyond the actual date/time, but we are
        ///     more concerned with it being the same value across any node the smart
        ///     contract may be executing on, than having that level of accuracy since
        ///     a time variance that small will not affect critically our calculations.
        /// </summary>
        /// <returns>Returns the reference date/time value in Unix timestamp format.</returns>
        public static BigInteger GetReferenceDateTime()
        {
            // reportErrorAndThrow(errPrefix + "Not implemented.");
            return Runtime.Time;
        }        

        /// <summary>
        /// This function checks to see if we are currently
        ///  executing on a NEO Express network instance.
        ///  
        /// WARNING: If this function is not kept updated as 
        ///  new networks are added with the network IDs
        ///  of those networks, it may return an incorrect
        ///  value!
        /// </summary>
        /// <returns>Returns TRUE if the current network we 
        ///  are executing is (allegedly) a NEO Express
        ///  instance, FALSE if not.</returns>
        public static bool IsNeoExpress()
        {
            bool bIsNeoExpress = false;

            var networkId = Runtime.GetNetwork();
            var networkName = "NEO Express";

            // Do the main net check first so we minimize
            //  GAS usage when it counts the most.
            if (networkId == 860833102)
            {
                /* Neo 3 MainNet */
                networkName = "Neo 3 MainNet";
            }
            else if (networkId == 877933390)
            {
                /* Neo 3 TestNet */
                networkName = "Neo 3 TestNet";
            }
            else if (networkId == 7630401)
            {
                /* Neo 2 MainNet */
                networkName = "Neo 2 MainNet";
            }
            else if (networkId == 1953787457)
            {
                /* Neo 2 TestNet */
                networkName = "Neo 2 TestNet";
            }
            else if (networkId == 844378958)
            {
                /* Neo 3 RC3 TestNet */
                networkName = "Neo 3 RC3 TestNet";
            }
            else if (networkId == 827601742)
            {
                /* Neo 3 RC1 TestNet */
                networkName = "Neo 3 RC1 TestNet";
            }
            else if (networkId == 894448462)
            {
                /* Neo 3 Preview 5 TestNet */
                networkName = "Neo 3 Preview 5 TestNet";
            }
            else
            {
                /* We assume it is a NEO Express instance. */
                bIsNeoExpress = true;
            }

            Runtime.Log($"CURRENT NEO NETWORK: {networkName} ");
            return bIsNeoExpress;
        }

        /// <summary>
        /// Helper function that returns TRUE if a string value
        ///  is empty, FALSE if not.
        /// </summary>
        /// <param name="str">The value to inspect.</param>
        /// <returns>Returns TRUE if the string value is
        ///  empty, FALSE if not.</returns>

        public static bool IsEmptyString(string str)
        {
            return "" == str;
        }

        /// <summary>
        /// Helper function that returns TRUE if a UInt160 value
        ///  contains anything but the default empty value.
        ///  FALSE otherwise.
        /// </summary>
        /// <param name="str">The value to inspect.</param>
        /// <returns>Returns TRUE if the UInt160 value is
        ///  empty, FALSE if not.</returns>
        public static bool IsEmptyOrInvalidUInt160(UInt160 uiValue) {
            var bIsValid = uiValue.IsValid;
            var bIsZero = false;

            if (bIsValid)
                 bIsZero = uiValue.IsZero;

            return (!bIsValid || bIsZero);
        }

        /// <summary>
        /// Helper function that returns TRUE if a ByteString value
        ///  is empty.  Returns FALSE otherwise.
        /// </summary>
        /// 
        /// <param name="str">The ByteString to inspect.</param>
        /// 
        /// <returns>Returns TRUE if the UInt160 value is
        ///  empty, FALSE if not.</returns>
        public static bool IsEmptyUInt160(ByteString str) {
            return "" == str;
        }


        /// <summary>
        /// Helper function that returns TRUE if a UInt160 value
        ///  contains a value that is not NULL, not empty,
        ///  and satisfies the UInt160 IsValid() function.
        /// </summary>
        /// <param name="uiValue">The value to inspect.</param>
        /// <returns>Returns TRUE if the UInt160 value is
        /// is considered valid, FALSE if not.</returns>
        public static bool IsValidUInt160(UInt160 uiValue) {
            if (uiValue is null || IsEmptyOrInvalidUInt160(uiValue) || !uiValue.IsValid)
                return false;
            else
                return true;
        }

        /// <summary>
        /// Validates the transaction sender and the makes sure
        ///  that it is equal to the given token owner value.
        /// </summary>
        /// <param name="tokenOwner">The current owner of 
        ///  a token.</param>
        /// <returns>Returns TRUE if the transaction sender
        ///  passes a CheckWitness() check and is equal
        ///  to the value given in the tokenOwner parameter.</returns>
        public static bool IsSenderTokenOwner(UInt160 tokenOwner)
        {
            if (IsEmptyOrInvalidUInt160(tokenOwner))
            {
                ReportErrorAndThrow($"({nameof(IsSenderTokenOwner)}) The token owner parameter is empty.");

                // This code will never breached since ReportErrorAndThrow() always
                //  throws and exception.  It is here to make the IDE and
                //  compiler not issue a warning.
                return false;
            }
            else
            {
                // Get a reference to the current transaction.
                var tx = (Transaction)Runtime.ScriptContainer;

                return (tx.Sender.Equals(tokenOwner) && Runtime.CheckWitness(tx.Sender));
            }
        }

        /// <summary>
        /// Validates the transaction sender and the makes sure
        ///  that it is equal to the given token owner value
        ///  OR it is the contract owner.
        /// </summary>
        /// <param name="tokenOwner">The current owner of 
        ///  a token.</param>
        /// <returns>Returns TRUE if the transaction sender
        ///  is the contract owner OR if the given tokenOwner
        ///  value is equal to the sender.</returns>
        public static bool IsSenderTokenOwnerOrContractOwner(UInt160 tokenOwner)
        {
            if (ValidateContractOwner())
                // It's the contract owner calling.
                return true;

            if (IsEmptyOrInvalidUInt160(tokenOwner))
                ReportErrorAndThrow($"({nameof(IsSenderTokenOwnerOrContractOwner)}) The token owner parameter is empty.");

            return IsSenderTokenOwner(tokenOwner);
        }

        /// <summary>
        /// Get the N3 address we have in storage that identifies
        ///  the contract owner.
        /// </summary>
        /// <returns>Returns the N3 address of the contract owner.</returns>
        public static UInt160 GetContractOwner() {
            return  (UInt160)Storage.Get(Storage.CurrentContext, FIELD_NAME_CONTRACT_OWNER);
        }


        /// <summary>
        /// Set the given address as the owner of this contract.
        /// </summary>
        /// <param name="addrOfContractOwner">The N3 address that should be set
        ///  as the contract owner.</param>
        public static void SetOwnerContract(UInt160 addrOfContractOwner)
        {
            if (!IsValidUInt160(addrOfContractOwner))
                ReportErrorAndThrow($"({nameof(SetOwnerContract)}) The addrOfContractOwner parameter value is invalid.");
            else
                Storage.Put(Storage.CurrentContext, FIELD_NAME_CONTRACT_OWNER, addrOfContractOwner);
        }

        /// <summary>
        /// Checks to see if the given address is the contract owner.
        /// </summary>
        /// <param name="addrToCheck">The N3 address to check.
        ///  as the contract owner.</param>
        /// <returns>Returns TRUE if the given address belongs to
        ///   the contract owner, FALSE if not.</returns>
        public static bool IsContractOwner(UInt160 addrToCheck)
        {
            if (!IsValidUInt160(addrToCheck))
                ReportErrorAndThrow($"({nameof(IsContractOwner)}) The addrToCheck parameter value is invalid.");

            UInt160 contractOwner = GetContractOwner();

            return (addrToCheck == contractOwner);
        }

        /// <summary>
        /// This function will throw an exception if the sender of
        ///  the transaction is not the owner of the contract or
        ///  if it fails the check witness call.
        /// </summary>
        public static void OnlyContractOwnerOrDie() {
            // Get a reference to the current transaction.
            var tx = (Transaction)Runtime.ScriptContainer;

            if (!(Runtime.CheckWitness(tx.Sender) && IsContractOwner(tx.Sender)))
                ReportErrorAndThrow($"({nameof(OnlyContractOwnerOrDie)}) Only the contract owner may call this method.");
        }

        /// <summary>
        /// Make sure this smart contract has a valid owner.
        /// </summary>
        /// <returns>Returns TRUE if the contract has a
        ///   valid owner, FALSE if not.</returns>
        public static bool ValidateContractOwner()
        {
            var contractOwner = GetContractOwner();
            var tx = (Transaction)Runtime.ScriptContainer;

            return contractOwner.Equals(tx.Sender) && Runtime.CheckWitness(contractOwner);
        }

        /// <summary>
        /// This function does a CheckWitness() call on the transaction
        ///  sender.  If the call fails, an Exception is thrown.
        /// </summary>
        /// <param name="callingMethod">The method calling this
        ///   function.  Used for error reporting.</param>
        public static void DoBasicCheckWitnessChecK(string callingMethod)
        {
            /*
            // TODO: Re-enable this after the hackathon.  Currently failing.
            
            // Validate the sender.
            if (!Runtime.CheckWitness(fromAddress))
            {
                // var strAddress = fromAddress.ToAddress(53);
                errMsg = $"({nameof(CreateDao)}) The sender of the transaction is invalid.";
                Runtime.Log(errMsg);
                throw new Exception(errMsg);
            }
            */

            Runtime.Log($"{callingMethod}: CheckWitness disabled temporarily for testing.");
        }

        /// <summary>
        /// Build a delimited string showing the status of the proposal.
        ///  (i.e. - all the statuses that are TRUE).
        /// </summary>
        public static string ProposalFlagsToString(ProposalFlags proposalFlagsObj) 
        {
            var listStatuses = new List<String>();

            if (proposalFlagsObj.IsSponsored)
                listStatuses.Add("sponsored");
            if (proposalFlagsObj.IsProcessed)
                listStatuses.Add("processed");
            if (proposalFlagsObj.IsDidPass)
                listStatuses.Add("passed");
            if (proposalFlagsObj.IsCancelled)
                listStatuses.Add("cancelled");
            if (proposalFlagsObj.IsWhitelist)
                listStatuses.Add("whitelisted");
            if (proposalFlagsObj.IsGuildKick)
                listStatuses.Add("kicked by guild");

            var strRet = "";

            foreach (var str in listStatuses)
            {
                if (strRet.Length > 0)
                    strRet += ", ";
                strRet += str;
            }

            return strRet;
        }        
    } // class MyUtilities
}