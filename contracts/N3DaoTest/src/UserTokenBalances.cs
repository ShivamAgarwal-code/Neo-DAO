using System;
using System.ComponentModel;
using System.Numerics;
using Neo;
using Neo.SmartContract;
using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Attributes;
using Neo.SmartContract.Framework.Native;
using Neo.SmartContract.Framework.Services;


#nullable enable

/**
    This file contains the UserTokenBalances object, 
    the object that manages the token balances for
    all operations in the DAO main contract.
*/

namespace AndroidTechnologies
{

    /// <summary>
    /// This class holds the details for a particular DAO.
    /// </summary>
    public class UserTokenBalances
    {
        // --------------------- CONSTANTS --------------------

        [InitialValue("4e554c506a596331693641526b3642664844454b7959316b50646b4c723244627956", ContractParameterType.ByteArray)]
        public static readonly UInt160 GUILD_ACCOUNT_ADDRESS = default!;

        [InitialValue("4e666758756634314c434361554d37356e4532714135656a4e57546d5846376a6148", ContractParameterType.ByteArray)]
        public static readonly UInt160 ESCROW_ACCOUNT_ADDRESS = default!;

        [InitialValue("4e6877765a43644e454d455a65344842726848556f41374c42445178747455683159", ContractParameterType.ByteArray)]
        public static readonly UInt160 TOTAL_BALANCE_ACCOUNT_ADDRESS = default!;


        /// <summary>
        /// Constructor.
        /// </summary>
        public UserTokenBalances() 
        {
        }

        // ---------------------------- PROPERTIES ----------------------

        /// <summary>
        /// This function makes sure that a given address isn't one
        ///  of the reserved ones we use for contract level account
        ///  balances.
        ///  
        /// NOTE: Technically this should never happen because 
        ///  actual N3 addresses would never be equal to our
        ///  "pseudo" account addresses, because the "pseudo"
        ///  addresses are not valid N3 addresses.  But just 
        ///  in case, we have this check.
        /// </summary>
        /// <param name="theAddress">The address to inspect.</param>
        /// <returns>Returns TRUE if the given address has
        ///  the same value as one of our "pseudo" account
        ///  addresses, FALSE if not.</returns>
        public static bool IsAddressReserved(UInt160 theAddress)
        {
            return (theAddress == GUILD_ACCOUNT_ADDRESS 
                    || 
                theAddress == ESCROW_ACCOUNT_ADDRESS
                    || 
                theAddress == TOTAL_BALANCE_ACCOUNT_ADDRESS);
        }

        // -------------------------------- DATA MEMBERS --------------------

        // -------------------- BEGIN: STORAGE MAPS --------

        // >>>>> Token balances map.

        const string MAP_OF_USER_TOKEN_BALANCES = "UTB:";

        private static StorageMap MapOfUserTokenBalances => new StorageMap(Storage.CurrentContext, MAP_OF_USER_TOKEN_BALANCES);

        /// <summary>
        /// Check to see if a user address is valid.
        /// </summary>
        /// <param name="userAddress">The user address to check.</param>
        /// <returns>Returns TRUE if the user address is valid, FALSE if not.</returns>
        private static bool IsValidUserAddress(UInt160 userAddress)
        {
            // TODO: Currently the "pseudo" account addresses are failing the UInt160.isValid check.
            //  So don't check those for now.  After the hackathon see why they are failing.  
            //  We don't allow those to be used by incoming addresses anyways during the 
            //  public method validation checks.
            if (!IsAddressReserved(userAddress))
                return MyUtilities.IsEmptyOrInvalidUInt160(userAddress);
            else
                return true;

        }

        /// <summary>
        /// Using a given owner address and a target DAO name,
        ///  build a key that can be used with storage map
        ///  based on the given DAO details object.
        /// </summary>
        /// <param name="daoDetailsObj">The DAO details object 
        ///  the operation is being performed for.
        /// <param name="userAddress">The address of the user
        ///  that the tokens are assigned to.</param>
        /// <param name="tokenContractHash">The contract hash
        ///  of the desired token..</param>
        /// 
        /// <returns>Returns a ByteString that can be used as a key
        ///  with a storage map.</returns>
        private static ByteString BuildKeyUTB(DaoDetails daoDetailsObj, UInt160 userAddress, UInt160 tokenContractHash)
        {
            if (null == daoDetailsObj)
                throw new Exception($"({nameof(BuildKeyUTB)}) The DAO details object is unassigned.");

            // The DAO details sequence of creation number should never be zero.
            if (0 >= daoDetailsObj.SequenceNumber)
                throw new Exception($"({nameof(BuildKeyUTB)}) The DAO details object has an invalid sequence number.");

            if (!IsValidUserAddress(userAddress))
                throw new Exception($"({nameof(BuildKeyUTB)}) The user address is invalid.");

            if (MyUtilities.IsEmptyOrInvalidUInt160(tokenContractHash))
                throw new Exception($"({nameof(BuildKeyUTB)}) The token contract hash is unassigned.");

            var strDaoDetailsSeqNum = (ByteString)daoDetailsObj.SequenceNumber;
            var strUserAddress = (ByteString)userAddress;
            var strTokenContractHash = (ByteString)tokenContractHash;
            var theKey = strDaoDetailsSeqNum +  strUserAddress + tokenContractHash;

            return theKey;
        }

        /// <summary>
        /// Retrieve the token balance for a particular user, and a
        ///  particular token, but within the context/scope of a
        ///  particular DAO.
        /// </summary>
        /// <param name="daoDetailsObj">The DAO details object 
        ///  the operation is being performed for.
        /// <param name="userAddress">The user's address</param>
        /// <param name="tokenContractHash">The contract hash for the the
        ///  desired token.</param>
        /// <returns>Returns the token balance for the given user and
        ///   the given token or zero if neither is found.
        ///   The search is done within the storage context of
        ///   the given DAO.</returns>
        public static BigInteger GetUserTokenBalance(DaoDetails daoDetailsObj, UInt160 userAddress, UInt160 tokenContractHash)
        {
            if (null == daoDetailsObj)
                throw new Exception($"({nameof(GetUserTokenBalance)}) The DAO details object is unassigned.");

            if (!IsValidUserAddress(userAddress))
                throw new Exception($"({nameof(GetUserTokenBalance)}) The user address is invalid.");

            if (MyUtilities.IsEmptyOrInvalidUInt160(tokenContractHash))
                throw new Exception($"({nameof(GetUserTokenBalance)}) The token contract address is invalid.");

            var theMapKey = BuildKeyUTB(daoDetailsObj, userAddress, tokenContractHash);
            var theBalance = (BigInteger)MapOfUserTokenBalances.Get(theMapKey);

            return theBalance;
        }

        /// <summary>
        /// Store the token balance for a particular user, and a
        ///  particular token, within the storage context of the
        ///  given DAO.
        /// </summary>
        /// <param name="daoDetailsObj">The DAO details object 
        ///  the operation is being performed for.
        /// <param name="userAddress">The user's address</param>
        /// <param name="tokenContractHash">The contract hash for the the
        ///  desired token.</param>
        /// <param name="newBalance">The new balance for the token.</param>
        public static void PutUserTokenBalance(DaoDetails daoDetailsObj, UInt160 userAddress, UInt160 tokenContractHash, BigInteger newBalance)
        {
            if (null == daoDetailsObj)
                throw new Exception($"({nameof(PutUserTokenBalance)}) The DAO details object is unassigned.");
            if (!IsValidUserAddress(userAddress))
                throw new Exception($"({nameof(PutUserTokenBalance)}) The user address is invalid.");
            if (MyUtilities.IsEmptyOrInvalidUInt160(tokenContractHash))
                throw new Exception($"({nameof(PutUserTokenBalance)}) The token contract address is empty.");
            if (newBalance < 0)
                throw new Exception($"({nameof(PutUserTokenBalance)}) The new balance value is negative.");

            var theMapKey = BuildKeyUTB(daoDetailsObj, userAddress, tokenContractHash);
            var strNewBalance = (ByteString)newBalance;
            MapOfUserTokenBalances.Put(theMapKey, strNewBalance);
        }

        /// <summary>
        /// Change the current token balance for the given DAO,
        ///  user, token combination by the amount specified.
        ///  (relative change based on existing value.)
        /// </summary>
        /// <param name="daoDetailsObj">The DAO details object 
        ///  the operation is being performed for.
        /// <param name="userAddress">The user's address</param>
        /// <param name="tokenContractHash">The contract hash for the the
        ///  desired token.</param>
        /// <param name="deltaBalance">The amount to change
        ///  the token balance by.</param>
        public static void ChangeUserTokenBalance(DaoDetails daoDetailsObj, UInt160 userAddress, UInt160 tokenContractHash, BigInteger deltaBalance)
        {
            if (null == daoDetailsObj) 
                throw new Exception($"({nameof(PutUserTokenBalance)}) The DAO details object is unassigned.");
            if (!IsValidUserAddress(userAddress))
                throw new Exception($"({nameof(PutUserTokenBalance)}) The user address is invalid.");
            if (MyUtilities.IsEmptyOrInvalidUInt160(tokenContractHash))
                throw new Exception($"({nameof(PutUserTokenBalance)}) The token contract address is empty.");

            var currentBalance = GetUserTokenBalance(daoDetailsObj, userAddress, tokenContractHash);
            var newBalance = currentBalance + deltaBalance;

            PutUserTokenBalance(daoDetailsObj, userAddress, tokenContractHash, newBalance);
        }        

        // -------------------- END  : STORAGE MAP -> MapOfEscrowUTB --------        

    }
}