using System;
using System.ComponentModel;
using System.Numerics;
using Neo;
using Neo.SmartContract.Framework;
// using Neo.SmartContract.Framework.Attributes;
using Neo.SmartContract.Framework.Native;
using Neo.SmartContract.Framework.Services;

/**
    NOTE: This file contains an object for associating a user address
        with a DAO's GUID.  The user address is the address of the user that
        is the DAO owner.
*/

#nullable enable

namespace AndroidTechnologies
{
    // --------------------- CONSTANTS --------------------

    /// <summary>
    /// An object whose sole purpose is to associate a user's
    ///  address, as the DAO owner, with a DAO's GUID.
    /// </summary>
    public class DaoOwnerXref
    {
        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="ownerAddress">the address of the DAO owner</param>
        /// <param name="ownerAddress">the GUID of a DAO</param>
        public DaoOwnerXref(UInt160 ownerAddress, BigInteger daoGuid)
        {
            if (MyUtilities.IsEmptyOrInvalidUInt160(ownerAddress))
                throw new Exception($"({nameof(DaoOwnerXref)}) The owner address is empty");
            if (BigInteger.Zero == daoGuid)
                throw new Exception($"({nameof(DaoOwnerXref)}) The DAO GUID is zero");

            this.ownerAddress = ownerAddress;
            this.IdOfDao = daoGuid;
        }

        public UInt160 ownerAddress = default!; // The DAO owner address.
        public BigInteger IdOfDao = BigInteger.Zero; // The GUID of the DAO 
    }
} 